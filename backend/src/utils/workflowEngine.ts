import { db } from '../db';
import { workflows, contacts, workflowExecutionQueue, workflowExecutionLogs, contactEmails, contactActivities } from '../db/schema';
import { eq, and, lte, or, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from './email';

export class WorkflowEngine {
  
  static async startWorker() {
    console.log('⚙️ [WORKFLOW_ENGINE] Background worker started');
    // Run every 10 seconds
    setInterval(() => {
      this.processQueue().catch(err => console.error('[WORKFLOW_ENGINE] Worker error:', err));
    }, 10000);
  }

  static async enrollContact(workflowId: string, contactId: string) {
    console.log(`[WORKFLOW_ENGINE] Enrolling contact ${contactId} in workflow ${workflowId}`);
    const flow = await db.query.workflows.findFirst({ where: eq(workflows.id, workflowId) });
    const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, contactId) });

    if (!flow || !contact) {
      console.error('[WORKFLOW_ENGINE] Workflow or Contact not found during enrollment.');
      return;
    }

    let nodes: any[] = typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes || [];
    let edges: any[] = typeof flow.edges === 'string' ? JSON.parse(flow.edges) : flow.edges || [];

    // Find trigger node
    const triggerNode = nodes.find(n => n.data?.type === 'trigger');
    if (!triggerNode) {
      console.error('[WORKFLOW_ENGINE] Workflow has no trigger node');
      return;
    }

    // Update workflow enrolled count and contact status
    await db.update(workflows)
      .set({ enrolledCount: (flow.enrolledCount || 0) + 1, lastRunAt: new Date().toISOString() })
      .where(eq(workflows.id, workflowId));
    
    await db.update(contacts)
      .set({ workflowId, workflowStatus: 'enrolled', updatedAt: new Date().toISOString() })
      .where(eq(contacts.id, contactId));

    // Log Activity
    await db.insert(contactActivities).values({
      id: uuidv4(),
      tenantId: flow.tenantId,
      workspaceId: flow.workspaceId,
      contactId,
      activityType: 'workflow_started',
      activityMessage: 'Workflow enrolled'
    }).catch(() => {});

    // Schedule next node
    await this.scheduleNextNodes(triggerNode.id, edges, flow, contactId, new Date());
  }

  static async scheduleNextNodes(sourceNodeId: string, edges: any[], flow: any, contactId: string, executeAt: Date, conditionLabel?: string) {
    // Find all edges extending from sourceNodeId
    let nextEdges = edges.filter(e => e.source === sourceNodeId);
    
    // If it's a conditional branch, we only follow the matching edge
    if (conditionLabel) {
      nextEdges = nextEdges.filter(e => e.label?.toLowerCase() === conditionLabel.toLowerCase() || !e.label);
      // fallback to un-labeled edge if specific label isn't found
      if (nextEdges.length === 0) {
        nextEdges = edges.filter(e => e.source === sourceNodeId);
      }
    }

    for (const edge of nextEdges) {
      const nextNodeId = edge.target;
      await db.insert(workflowExecutionQueue).values({
        id: uuidv4(),
        tenantId: flow.tenantId,
        workspaceId: flow.workspaceId,
        workflowId: flow.id,
        contactId,
        nodeId: nextNodeId,
        status: 'pending',
        executeAt: executeAt.toISOString(),
        createdAt: new Date().toISOString()
      });
      console.log(`[WORKFLOW_ENGINE] Scheduled node ${nextNodeId} for contact ${contactId}`);
    }
  }

  static async processQueue() {
    const now = new Date().toISOString();
    
    // Find due tasks that are pending or delayed
    const dueTasks = await db.query.workflowExecutionQueue.findMany({
      where: and(
        lte(workflowExecutionQueue.executeAt, now),
        or(eq(workflowExecutionQueue.status, 'pending'), eq(workflowExecutionQueue.status, 'delayed'))
      ),
      limit: 50 // process in batches
    });

    if (dueTasks.length === 0) return;

    // Mark as processing
    const taskIds = dueTasks.map(t => t.id);
    await db.update(workflowExecutionQueue)
      .set({ status: 'processing', updatedAt: new Date().toISOString() })
      .where(inArray(workflowExecutionQueue.id, taskIds));

    for (const task of dueTasks) {
      try {
        await this.executeTask(task);
      } catch (err: any) {
        console.error(`[WORKFLOW_ENGINE] Task ${task.id} failed:`, err);
        const retryCount = (task.retryCount || 0) + 1;
        if (retryCount >= 3) {
           await db.update(workflowExecutionQueue)
            .set({ status: 'failed', error: err.message, updatedAt: new Date().toISOString() })
            .where(eq(workflowExecutionQueue.id, task.id));
        } else {
           // delay retry by 5 minutes
           const nextTime = new Date();
           nextTime.setMinutes(nextTime.getMinutes() + 5);
           await db.update(workflowExecutionQueue)
            .set({ status: 'delayed', retryCount, executeAt: nextTime.toISOString(), error: err.message, updatedAt: new Date().toISOString() })
            .where(eq(workflowExecutionQueue.id, task.id));
        }
      }
    }
  }

  static async executeTask(task: any) {
    const flow = await db.query.workflows.findFirst({ where: eq(workflows.id, task.workflowId) });
    const contact = await db.query.contacts.findFirst({ where: eq(contacts.id, task.contactId) });

    if (!flow || !contact) {
       await db.update(workflowExecutionQueue).set({ status: 'failed', error: 'Workflow or Contact missing' }).where(eq(workflowExecutionQueue.id, task.id));
       return;
    }

    let nodes: any[] = typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes || [];
    let edges: any[] = typeof flow.edges === 'string' ? JSON.parse(flow.edges) : flow.edges || [];
    const node = nodes.find(n => n.id === task.nodeId);

    if (!node) {
      await db.update(workflowExecutionQueue).set({ status: 'failed', error: 'Node not found in workflow' }).where(eq(workflowExecutionQueue.id, task.id));
      return;
    }

    console.log(`[WORKFLOW_ENGINE] Executing node ${node.id} (${node.data?.type}) for contact ${contact.email}`);
    let branchOutcome: string | undefined = undefined;

    if (node.data?.type === 'condition' && (node.data.label?.toLowerCase().includes('wait') || node.data.label?.toLowerCase().includes('delay'))) {
      // It's a delay node. We already executed the delay if it's in the queue due now!
      // Wait, if it's a delay node, the first time we process it, we should delay the *next* node.
      // So this task itself executes immediately, but we schedule the *next* node with a delay.
      const delayVal = Number(node.data.config?.delay || 0);
      const delayUnit = node.data.config?.unit || 'days';
      const nextExecutionTime = new Date();
      if (delayUnit === 'minutes') nextExecutionTime.setMinutes(nextExecutionTime.getMinutes() + delayVal);
      else if (delayUnit === 'hours') nextExecutionTime.setHours(nextExecutionTime.getHours() + delayVal);
      else if (delayUnit === 'days') nextExecutionTime.setDate(nextExecutionTime.getDate() + delayVal);

      await this.scheduleNextNodes(node.id, edges, flow, contact.id, nextExecutionTime);
      
    } else if (node.data?.type === 'condition') {
      // E.g. Check purchase status
      const field = node.data.config?.field;
      const op = node.data.config?.operator;
      const val = node.data.config?.value;
      
      // Simulate condition check for now
      branchOutcome = 'No'; // default
      if (field === 'purchase_status' && contact.status === 'converted') branchOutcome = 'Yes';
      
      await this.scheduleNextNodes(node.id, edges, flow, contact.id, new Date(), branchOutcome);

    } else if (node.data?.type === 'action') {
      // E.g. Send Email
      if (node.data.label?.toLowerCase().includes('email') || node.data.label?.toLowerCase().includes('send')) {
        const subject = node.data.config?.subject || 'Message from HubSaaS';
        const bodyTemplate = node.data.config?.body || 'Hello {{name}}';
        const htmlContent = bodyTemplate.replace(/\{\{name\}\}/g, contact.name).replace(/\n/g, '<br />');

        const result = await sendEmail({
          to: contact.email,
          subject,
          html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">${htmlContent}</div>`
        });

        if (!result.success) {
          throw new Error('Email sending failed: ' + (result.message || result.error));
        }

        // Record email
        await db.insert(contactEmails).values({
          id: uuidv4(),
          tenantId: flow.tenantId,
          workspaceId: flow.workspaceId,
          contactId: contact.id,
          workflowId: flow.id,
          subject,
          body: bodyTemplate.replace(/\{\{name\}\}/g, contact.name),
          status: 'sent',
          messageId: (result as any).messageId || null,
          provider: 'resend',
          sentAt: new Date().toISOString()
        }).catch((err) => { console.error('Failed to record email log:', err); });

        // Log Activity
        await db.insert(contactActivities).values({
          id: uuidv4(),
          tenantId: flow.tenantId,
          workspaceId: flow.workspaceId,
          contactId: contact.id,
          activityType: 'email_sent',
          activityMessage: `Email sent: ${subject}`
        }).catch((err) => { console.error('Failed to log email activity:', err); });
      }
      
      // Schedule next immediately
      await this.scheduleNextNodes(node.id, edges, flow, contact.id, new Date());

    } else if (node.data?.type === 'end') {
      // Mark workflow completed for this contact
      await db.update(contacts)
        .set({ workflowStatus: 'completed', status: 'converted', leadScore: (contact.leadScore || 0) + 50, updatedAt: new Date().toISOString() })
        .where(eq(contacts.id, contact.id));
      
      const enrolledCount = flow.enrolledCount || 0;
      const rate = enrolledCount > 0 ? Number((((flow.conversionCount || 0) + 1) / enrolledCount) * 100).toFixed(1) : 100;
      await db.update(workflows)
        .set({ 
           completedCount: (flow.completedCount || 0) + 1, 
           conversionCount: (flow.conversionCount || 0) + 1,
           conversionRate: Number(rate),
           updatedAt: new Date().toISOString()
        })
        .where(eq(workflows.id, flow.id));
        
      await db.insert(contactActivities).values({
        id: uuidv4(),
        tenantId: flow.tenantId,
        workspaceId: flow.workspaceId,
        contactId: contact.id,
        activityType: 'lead_converted',
        activityMessage: 'Lead converted via workflow'
      }).catch(() => {});
    }

    // Log success
    await db.insert(workflowExecutionLogs).values({
      id: uuidv4(),
      tenantId: flow.tenantId,
      workspaceId: flow.workspaceId,
      workflowId: flow.id,
      contactId: contact.id,
      nodeId: node.id,
      status: 'success',
      details: 'Node executed successfully'
    });

    // Remove task from queue
    await db.delete(workflowExecutionQueue).where(eq(workflowExecutionQueue.id, task.id));
  }
}
