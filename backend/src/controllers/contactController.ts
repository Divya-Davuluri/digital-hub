import { Request, Response } from 'express';
import { db } from '../db';
import { contacts, workflows, tenants, workspaces, contactActivities, contactEmails } from '../db/schema';
import { sendEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';
import { sql, eq, and } from 'drizzle-orm';
import { asyncHandler } from '../utils/errors';

export const submitContactForm = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message, phone, company, source, tenantId, workspaceId } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required fields.'
    });
  }

  // Resolve tenant and workspace if not supplied
  let resolvedTenantId = tenantId;
  let resolvedWorkspaceId = workspaceId;

  if (!resolvedTenantId) {
    const firstTenantRows = await db.select({ id: tenants.id }).from(tenants).limit(1);
    resolvedTenantId = firstTenantRows[0]?.id || 'default-tenant';
  }

  if (!resolvedWorkspaceId) {
    const firstWorkspaceRows = await db.select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.tenantId, resolvedTenantId))
      .limit(1);
    resolvedWorkspaceId = firstWorkspaceRows[0]?.id || 'default-workspace';
  }

  // 1. Save contact into database (with deduplication: avoid duplicate email in same workspace)
  const existingContacts = await db.select()
    .from(contacts)
    .where(and(
      eq(contacts.email, email.trim().toLowerCase()),
      eq(contacts.workspaceId, resolvedWorkspaceId)
    ))
    .limit(1);

  let contactId = '';
  if (existingContacts.length > 0) {
    contactId = existingContacts[0].id;
    // Update existing contact details
    await db.update(contacts)
      .set({
        name: name.trim(),
        message: message.trim(),
        phone: phone || existingContacts[0].phone || null,
        company: company || existingContacts[0].company || null,
        source: source || existingContacts[0].source || 'contact_form',
        updatedAt: new Date().toISOString()
      })
      .where(eq(contacts.id, contactId));
    console.log(`[CONTACT_DEDUPLICATION] Updated existing contact: ${email} (ID: ${contactId}) in workspace: ${resolvedWorkspaceId}`);
  } else {
    contactId = uuidv4();
    // Insert new contact
    await db.insert(contacts).values({
      id: contactId,
      tenantId: resolvedTenantId,
      workspaceId: resolvedWorkspaceId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      company: company || null,
      source: source || 'contact_form',
      status: 'new',
      leadScore: 10, // Starter score
      tags: '',
      workflowId: null,
      workflowStatus: null,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Log contact creation activity
    try {
      await db.insert(contactActivities).values({
        id: uuidv4(),
        tenantId: resolvedTenantId,
        workspaceId: resolvedWorkspaceId,
        contactId,
        activityType: 'created',
        activityMessage: 'Contact created'
      });
    } catch (err: any) {
      console.error('Failed to log contact creation activity:', err.message);
    }

    console.log(`[CONTACT_CREATED] Inserted new contact: ${email} (ID: ${contactId}) in workspace: ${resolvedWorkspaceId}`);
  }

  // 2. Trigger workflow automation when form submitted
  // Find active workflows with triggerType = 'form_submit'
  const activeWorkflows = await db.select()
    .from(workflows)
    .where(and(
      eq(workflows.tenantId, resolvedTenantId),
      eq(workflows.status, 'active'),
      eq(workflows.triggerType, 'form_submit')
    ));

  console.log(`[WORKFLOW_ENGINE] Found ${activeWorkflows.length} active form_submit workflows for tenant ${resolvedTenantId}`);

  // Enroll in active workflows or run default simulation
  if (activeWorkflows.length > 0) {
    for (const flow of activeWorkflows) {
      // 3. Enroll contact into workflow: increment enrolledCount
      const currentEnrolled = (flow.enrolledCount || 0) + 1;
      await db.update(workflows)
        .set({
          enrolledCount: currentEnrolled,
          lastRunAt: new Date().toISOString()
        })
        .where(eq(workflows.id, flow.id));

      // Update contact status to enrolled
      await db.update(contacts)
        .set({
          workflowId: flow.id,
          workflowStatus: 'enrolled',
          updatedAt: new Date().toISOString()
        })
        .where(eq(contacts.id, contactId));

      // Log activity
      try {
        await db.insert(contactActivities).values({
          id: uuidv4(),
          tenantId: resolvedTenantId,
          workspaceId: resolvedWorkspaceId,
          contactId,
          activityType: 'workflow_started',
          activityMessage: 'Workflow enrolled'
        });
      } catch (err: any) {
        console.error('Failed to log workflow enrollment activity:', err.message);
      }

      console.log(`[WORKFLOW_ENGINE] Enrolled contact ${email} in workflow: ${flow.name} (Enrolled total: ${currentEnrolled})`);

      // Run execution flow in background
      executeWorkflowFlow(flow, contactId, name, email, currentEnrolled);
    }
  } else {
    // Run default simulation sequence so it works end-to-end
    console.log('[WORKFLOW_ENGINE] No active workflows in DB. Running default simulation.');
    await db.update(contacts)
      .set({
        workflowStatus: 'enrolled',
        updatedAt: new Date().toISOString()
      })
      .where(eq(contacts.id, contactId));

    // Log default workflow enrollment activity
    try {
      await db.insert(contactActivities).values({
        id: uuidv4(),
        tenantId: resolvedTenantId,
        workspaceId: resolvedWorkspaceId,
        contactId,
        activityType: 'workflow_started',
        activityMessage: 'Workflow enrolled'
      });
    } catch (err: any) {
      console.error('Failed to log workflow enrollment activity:', err.message);
    }

    runDefaultSimulation(contactId, name, email, resolvedTenantId, resolvedWorkspaceId);
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for contacting us! Your message has been received.',
    contactId
  });
});

/**
 * Executes the active ReactFlow nodes and edges sequence in background
 */
async function executeWorkflowFlow(flow: any, contactId: string, name: string, email: string, currentEnrolled: number) {
  try {
    let nodes: any[] = [];
    try {
      nodes = typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes || [];
    } catch (e) {
      nodes = [];
    }

    // Find the Send Email action and the Wait condition
    const waitNode = nodes.find((n: any) => 
      n.data?.type === 'condition' && 
      (n.data?.label?.toLowerCase().includes('wait') || n.data?.label?.toLowerCase().includes('delay'))
    );

    const emailNode = nodes.find((n: any) => 
      n.data?.type === 'action' && 
      (n.data?.label?.toLowerCase().includes('email') || n.data?.label?.toLowerCase().includes('send') || n.data?.label?.toLowerCase().includes('welcome'))
    );

    let delayMs = 60000; // Default 1 minute delay
    if (waitNode?.data?.config?.delay) {
      const value = Number(waitNode.data.config.delay);
      const unit = waitNode.data.config.unit || 'days';
      if (unit === 'minutes') {
        delayMs = value * 60 * 1000;
      } else if (unit === 'hours') {
        delayMs = value * 60 * 60 * 1000;
      } else if (unit === 'days') {
        // Convert days to minutes for easily verifiable demo delays
        delayMs = 60000; 
      }
    }

    console.log(`[WORKFLOW_ENGINE] Scheduling email node for ${email} in ${delayMs / 1000} seconds`);

    setTimeout(async () => {
      // 4. Send Email after delay
      const subject = emailNode?.data?.config?.subject || 'Welcome to HubSaaS';
      const bodyTemplate = emailNode?.data?.config?.body || `Hello {{name}},\n\nThank you for contacting us. We will get back to you shortly!\n\nBest regards,\nHubSaaS Team`;
      const htmlContent = bodyTemplate.replace(/\{\{name\}\}/g, name).replace(/\n/g, '<br />');

      await sendEmail({
        to: email,
        subject,
        html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">${htmlContent}</div>`
      });

      // Save to contact_emails
      try {
        await db.insert(contactEmails).values({
          id: uuidv4(),
          tenantId: flow.tenantId,
          workspaceId: flow.workspaceId,
          contactId,
          workflowId: flow.id,
          subject,
          body: bodyTemplate.replace(/\{\{name\}\}/g, name),
          status: 'sent',
          provider: 'resend',
          sentAt: new Date().toISOString()
        });
      } catch (err: any) {
        console.error('Failed to save email history:', err.message);
      }

      // Log email_sent Activity
      try {
        await db.insert(contactActivities).values({
          id: uuidv4(),
          tenantId: flow.tenantId,
          workspaceId: flow.workspaceId,
          contactId,
          activityType: 'email_sent',
          activityMessage: 'Email sent'
        });
      } catch (err: any) {
        console.error('Failed to log email activity:', err.message);
      }

      // Update contact status to completed and converted
      await db.update(contacts)
        .set({
          status: 'converted',
          workflowStatus: 'completed',
          leadScore: 50, // Increase score on conversion
          updatedAt: new Date().toISOString()
        })
        .where(eq(contacts.id, contactId));

      // Log lead_converted Activity
      try {
        await db.insert(contactActivities).values({
          id: uuidv4(),
          tenantId: flow.tenantId,
          workspaceId: flow.workspaceId,
          contactId,
          activityType: 'lead_converted',
          activityMessage: 'Lead converted'
        });
      } catch (err: any) {
        console.error('Failed to log auto-convert activity:', err.message);
      }

      // 5. Update workflow metrics: completed, converted, conversion rate
      const currentCompleted = (flow.completedCount || 0) + 1;
      const currentConverted = (flow.conversionCount || 0) + 1;
      const rate = currentEnrolled > 0 ? Number(((currentConverted / currentEnrolled) * 100).toFixed(1)) : 100;

      await db.update(workflows)
        .set({
          completedCount: currentCompleted,
          conversionCount: currentConverted,
          conversionRate: rate,
          updatedAt: new Date().toISOString()
        })
        .where(eq(workflows.id, flow.id));

      console.log(`[WORKFLOW_ENGINE] Workflow metrics & contact status successfully updated!`);
    }, delayMs);

  } catch (error) {
    console.error('[WORKFLOW_ENGINE_ERROR]', error);
  }
}

/**
 * Simulated default flow execution when no workflows are saved in DB
 */
function runDefaultSimulation(contactId: string, name: string, email: string, tenantId: string, workspaceId: string) {
  setTimeout(async () => {
    const subject = 'Welcome to HubSaaS';
    const body = `Hello ${name},\n\nThank you for contacting us. We have received your message and our team will get back to you shortly.`;

    await sendEmail({
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to HubSaaS! 🎉</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for contacting us. We have received your message and our team will get back to you shortly.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This email was automatically sent via Digital Marketing Hub Workflow Engine.</p>
        </div>
      `
    });

    // Save to contact_emails
    try {
      await db.insert(contactEmails).values({
        id: uuidv4(),
        tenantId,
        workspaceId,
        contactId,
        workflowId: null,
        subject,
        body,
        status: 'sent',
        provider: 'resend',
        sentAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Failed to save email history:', err.message);
    }

    // Log email_sent Activity
    try {
      await db.insert(contactActivities).values({
        id: uuidv4(),
        tenantId,
        workspaceId,
        contactId,
        activityType: 'email_sent',
        activityMessage: 'Email sent'
      });
    } catch (err: any) {
      console.error('Failed to log email activity:', err.message);
    }

    // Update contact status on successful simulation run
    await db.update(contacts)
      .set({
        status: 'converted',
        workflowStatus: 'completed',
        leadScore: 50,
        updatedAt: new Date().toISOString()
      })
      .where(eq(contacts.id, contactId));

    // Log lead_converted Activity
    try {
      await db.insert(contactActivities).values({
        id: uuidv4(),
        tenantId,
        workspaceId,
        contactId,
        activityType: 'lead_converted',
        activityMessage: 'Lead converted'
      });
    } catch (err: any) {
      console.error('Failed to log auto-convert activity:', err.message);
    }

    console.log(`[WORKFLOW_SIMULATION] Completed welcoming ${email}`);
  }, 60000); // 1 minute
}
