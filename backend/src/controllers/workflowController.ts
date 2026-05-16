import { Request, Response } from 'express';
import { db } from '../db';
import {
  workflows, workflowTemplates,
  workspaces, clients
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';

// Helper for safe JSON parsing
const safeJsonParse = (str: string | null, 
  fallback: any = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
};

// Helper to format workflow for response
const formatWorkflow = (w: any) => ({
  ...w,
  nodes: safeJsonParse(w.nodes, []),
  edges: safeJsonParse(w.edges, []),
});

export const createWorkflow = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const {
    clientId, name, description,
    triggerType, nodes, edges
  } = req.body;

  if (!name?.trim()) {
    throw new AppError('Workflow name is required', 400);
  }

  // Get workspace
  let workspaceId = '';
  if (clientId) {
    const ws = await db.query.workspaces.findFirst({
      where: and(
        eq(workspaces.tenantId, tenantId),
        eq(workspaces.clientId, clientId)
      )
    });
    workspaceId = ws?.id || '';
  }
  
  if (!workspaceId) {
    const ws = await db.query.workspaces.findFirst({
      where: eq(workspaces.tenantId, tenantId)
    });
    workspaceId = ws?.id || tenantId;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(workflows).values({
    id,
    tenantId,
    workspaceId,
    clientId: clientId || null,
    name: name.trim(),
    description: description || null,
    status: 'draft',
    triggerType: triggerType || 'form_submit',
    nodes: Array.isArray(nodes)
      ? JSON.stringify(nodes) : (nodes || '[]'),
    edges: Array.isArray(edges)
      ? JSON.stringify(edges) : (edges || '[]'),
    enrolledCount:  0,
    completedCount: 0,
    conversionCount: 0,
    conversionRate:  0,
    lastRunAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.query.workflows.findFirst({
    where: eq(workflows.id, id)
  });

  res.status(201).json({
    success: true,
    data: formatWorkflow(created)
  });
});

export const getWorkflows = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const all = await db
      .select()
      .from(workflows)
      .where(eq(workflows.tenantId, tenantId))
      .orderBy(desc(workflows.createdAt));

    const formatted = all.map(formatWorkflow);

    if (formatted.length === 0) {
      return res.json({
        success: true,
        data: getDemoWorkflows(),
        source: 'demo'
      });
    }

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('[Workflows] getWorkflows error:', err);
    res.json({
      success: true,
      data: getDemoWorkflows(),
      source: 'demo'
    });
  }
});

export const getWorkflow = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const workflow = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.id, id),
      eq(workflows.tenantId, tenantId)
    )
  });

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  res.json({ success: true, data: formatWorkflow(workflow) });
});

export const updateWorkflow = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;
  const {
    name, description, nodes,
    edges, status, triggerType
  } = req.body;

  const existing = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.id, id),
      eq(workflows.tenantId, tenantId)
    )
  });

  if (!existing) {
    throw new AppError('Workflow not found', 404);
  }

  const updateData: any = {
    updatedAt: new Date().toISOString()
  };

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) 
    updateData.description = description;
  if (nodes !== undefined) updateData.nodes = 
    Array.isArray(nodes) 
      ? JSON.stringify(nodes) : nodes;
  if (edges !== undefined) updateData.edges = 
    Array.isArray(edges) 
      ? JSON.stringify(edges) : edges;
  if (status !== undefined) updateData.status = status;
  if (triggerType !== undefined) 
    updateData.triggerType = triggerType;

  await db.update(workflows)
    .set(updateData)
    .where(and(
      eq(workflows.id, id),
      eq(workflows.tenantId, tenantId)
    ));

  const updated = await db.query.workflows.findFirst({
    where: eq(workflows.id, id)
  });

  res.json({ success: true, data: formatWorkflow(updated) });
});

export const deleteWorkflow = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  const existing = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.id, id),
      eq(workflows.tenantId, tenantId)
    )
  });

  if (!existing) {
    throw new AppError('Workflow not found', 404);
  }

  await db.delete(workflows)
    .where(and(
      eq(workflows.id, id),
      eq(workflows.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'Workflow deleted successfully'
  });
});

export const activateWorkflow = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.update(workflows)
    .set({
      status: 'active',
      updatedAt: new Date().toISOString()
    })
    .where(and(
      eq(workflows.id, id),
      eq(workflows.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'Workflow activated successfully'
  });
});

export const pauseWorkflow = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.update(workflows)
    .set({
      status: 'paused',
      updatedAt: new Date().toISOString()
    })
    .where(and(
      eq(workflows.id, id),
      eq(workflows.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'Workflow paused successfully'
  });
});

export const getTemplates = asyncHandler(
  async (req: any, res: Response) => {
  res.json({
    success: true,
    data: getBuiltInTemplates()
  });
});

export const createFromTemplate = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { templateId, name, clientId } = req.body;

  const templates = getBuiltInTemplates();
  const template = templates.find(t => t.id === templateId);

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Get workspace
  let workspaceId = '';
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.tenantId, tenantId)
  });
  workspaceId = ws?.id || tenantId;

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(workflows).values({
    id,
    tenantId,
    workspaceId,
    clientId: clientId || null,
    name: name || template.name,
    description: template.description || null,
    status: 'draft',
    triggerType: template.triggerType,
    nodes: JSON.stringify(template.nodes),
    edges: JSON.stringify(template.edges),
    enrolledCount:  0,
    completedCount: 0,
    conversionCount: 0,
    conversionRate:  0,
    lastRunAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.query.workflows.findFirst({
    where: eq(workflows.id, id)
  });

  res.status(201).json({
    success: true,
    data: formatWorkflow(created)
  });
});

function getDemoWorkflows() {
  const templates = getBuiltInTemplates();
  return [
    {
      id: 'demo-wf-1',
      name: 'Welcome Email Series',
      description: 
        'Onboard new leads with a 3-email sequence',
      status: 'active',
      triggerType: 'form_submit',
      enrolledCount: 124,
      completedCount: 98,
      conversionCount: 23,
      conversionRate: 18.5,
      lastRunAt: new Date(
        Date.now() - 2*60*60*1000).toISOString(),
      nodes: templates[0].nodes,
      edges: templates[0].edges,
      createdAt: new Date(
        Date.now() - 30*86400000).toISOString(),
    },
    {
      id: 'demo-wf-2',
      name: 'Abandoned Cart Recovery',
      description: 'Recover lost sales with 3-step sequence',
      status: 'active',
      triggerType: 'purchase',
      enrolledCount: 67,
      completedCount: 45,
      conversionCount: 12,
      conversionRate: 17.9,
      lastRunAt: new Date(
        Date.now() - 30*60*1000).toISOString(),
      nodes: templates[2].nodes,
      edges: templates[2].edges,
      createdAt: new Date(
        Date.now() - 20*86400000).toISOString(),
    },
    {
      id: 'demo-wf-3',
      name: 'Lead Nurture Sequence',
      description: 'Score and nurture leads to sales-ready',
      status: 'paused',
      triggerType: 'form_submit',
      enrolledCount: 340,
      completedCount: 280,
      conversionCount: 45,
      conversionRate: 13.2,
      lastRunAt: new Date(
        Date.now() - 2*86400000).toISOString(),
      nodes: templates[3].nodes,
      edges: templates[3].edges,
      createdAt: new Date(
        Date.now() - 45*86400000).toISOString(),
    },
    {
      id: 'demo-wf-4',
      name: 'Re-engagement Campaign',
      description: 'Win back inactive contacts',
      status: 'draft',
      triggerType: 'scheduled',
      enrolledCount: 0,
      completedCount: 0,
      conversionCount: 0,
      conversionRate: 0,
      lastRunAt: null,
      nodes: templates[4].nodes,
      edges: templates[4].edges,
      createdAt: new Date(
        Date.now() - 5*86400000).toISOString(),
    },
  ];
}

function getBuiltInTemplates() {
  return [
    {
      id: 'tpl-welcome',
      name: 'Welcome Series',
      description: 
        'Onboard new leads with a warm welcome sequence',
      category: 'welcome',
      icon: '👋',
      triggerType: 'form_submit',
      nodes: [
        {
          id: 'n1',
          type: 'triggerNode',
          position: { x: 250, y: 50 },
          data: {
            label: 'Form Submit',
            type: 'trigger',
            icon: '🎯',
            description: 'Contact fills a form',
            config: { formId: 'any' }
          }
        },
        {
          id: 'n2',
          type: 'actionNode',
          position: { x: 250, y: 180 },
          data: {
            label: 'Send Welcome Email',
            type: 'action',
            icon: '📧',
            description: 'Send the welcome email',
            config: {
              subject: 'Welcome! Here is how to get started',
              template: 'welcome'
            }
          }
        },
        {
          id: 'n3',
          type: 'conditionNode',
          position: { x: 250, y: 310 },
          data: {
            label: 'Wait 2 Days',
            type: 'condition',
            icon: '⏰',
            description: 'Wait before next step',
            config: { delay: 2, unit: 'days' }
          }
        },
        {
          id: 'n4',
          type: 'actionNode',
          position: { x: 250, y: 440 },
          data: {
            label: 'Send Getting Started',
            type: 'action',
            icon: '📧',
            description: 'Tips to get started',
            config: {
              subject: 'Getting started guide just for you',
              template: 'getting_started'
            }
          }
        },
        {
          id: 'n5',
          type: 'conditionNode',
          position: { x: 250, y: 570 },
          data: {
            label: 'Wait 3 Days',
            type: 'condition',
            icon: '⏰',
            description: 'Wait before next step',
            config: { delay: 3, unit: 'days' }
          }
        },
        {
          id: 'n6',
          type: 'actionNode',
          position: { x: 250, y: 700 },
          data: {
            label: 'Send Success Story',
            type: 'action',
            icon: '📧',
            description: 'Share a customer success story',
            config: {
              subject: 'See how others achieve results',
              template: 'success_story'
            }
          }
        },
        {
          id: 'n7',
          type: 'endNode',
          position: { x: 250, y: 830 },
          data: {
            label: 'Flow Complete',
            type: 'end',
            icon: '🏁',
            description: 'Sequence finished',
            config: {}
          }
        }
      ],
      edges: [
        { id:'e1-2', source:'n1', target:'n2',
          animated: true },
        { id:'e2-3', source:'n2', target:'n3',
          animated: true },
        { id:'e3-4', source:'n3', target:'n4',
          animated: true },
        { id:'e4-5', source:'n4', target:'n5',
          animated: true },
        { id:'e5-6', source:'n5', target:'n6',
          animated: true },
        { id:'e6-7', source:'n6', target:'n7',
          animated: true },
      ]
    },
    {
      id: 'tpl-retargeting',
      name: 'Retargeting Sequence',
      description: 
        'Convert engaged leads who have not purchased',
      category: 'retargeting',
      icon: '🎯',
      triggerType: 'ad_engagement',
      nodes: [
        {
          id: 'n1',
          type: 'triggerNode',
          position: { x: 250, y: 50 },
          data: {
            label: 'Ad Engagement',
            type: 'trigger',
            icon: '📱',
            description: 'User engages with ad',
            config: {}
          }
        },
        {
          id: 'n2',
          type: 'conditionNode',
          position: { x: 250, y: 180 },
          data: {
            label: 'Wait 1 Day',
            type: 'condition',
            icon: '⏰',
            description: 'Wait 24 hours',
            config: { delay: 1, unit: 'days' }
          }
        },
        {
          id: 'n3',
          type: 'conditionNode',
          position: { x: 250, y: 310 },
          data: {
            label: 'Purchased?',
            type: 'condition',
            icon: '🔀',
            description: 'Check if already purchased',
            config: {
              field: 'purchase_status',
              operator: 'equals',
              value: 'completed'
            }
          }
        },
        {
          id: 'n4',
          type: 'endNode',
          position: { x: 450, y: 440 },
          data: {
            label: 'Goal Reached',
            type: 'end',
            icon: '🏆',
            description: 'Already purchased!',
            config: {}
          }
        },
        {
          id: 'n5',
          type: 'actionNode',
          position: { x: 50, y: 440 },
          data: {
            label: 'Send Reminder',
            type: 'action',
            icon: '📧',
            description: 'Send reminder email',
            config: {
              subject: 'Still thinking it over?',
              template: 'reminder'
            }
          }
        },
        {
          id: 'n6',
          type: 'conditionNode',
          position: { x: 50, y: 570 },
          data: {
            label: 'Wait 2 Days',
            type: 'condition',
            icon: '⏰',
            description: 'Wait 2 more days',
            config: { delay: 2, unit: 'days' }
          }
        },
        {
          id: 'n7',
          type: 'actionNode',
          position: { x: 50, y: 700 },
          data: {
            label: 'Send Discount',
            type: 'action',
            icon: '🎁',
            description: 'Send 10% off discount',
            config: {
              subject: 'Special offer just for you — 10% off',
              template: 'discount'
            }
          }
        }
      ],
      edges: [
        { id:'e1-2', source:'n1', target:'n2',
          animated: true },
        { id:'e2-3', source:'n2', target:'n3',
          animated: true },
        { id:'e3-4', source:'n3', target:'n4',
          animated: true, label: 'Yes' },
        { id:'e3-5', source:'n3', target:'n5',
          animated: true, label: 'No' },
        { id:'e5-6', source:'n5', target:'n6',
          animated: true },
        { id:'e6-7', source:'n6', target:'n7',
          animated: true },
      ]
    },
    {
      id: 'tpl-abandoned',
      name: 'Abandoned Cart Recovery',
      description: 
        'Recover lost sales with timely reminders',
      category: 'abandoned_cart',
      icon: '🛒',
      triggerType: 'purchase',
      nodes: [
        {
          id: 'n1',
          type: 'triggerNode',
          position: { x: 250, y: 50 },
          data: {
            label: 'Cart Abandoned',
            type: 'trigger',
            icon: '🛒',
            description: 'User abandons cart',
            config: {}
          }
        },
        {
          id: 'n2',
          type: 'conditionNode',
          position: { x: 250, y: 180 },
          data: {
            label: 'Wait 1 Hour',
            type: 'condition',
            icon: '⏰',
            description: 'Wait 1 hour',
            config: { delay: 1, unit: 'hours' }
          }
        },
        {
          id: 'n3',
          type: 'actionNode',
          position: { x: 250, y: 310 },
          data: {
            label: 'Send Cart Reminder',
            type: 'action',
            icon: '📧',
            description: 'Remind about cart items',
            config: {
              subject: 'You left something behind!',
              template: 'cart_reminder'
            }
          }
        },
        {
          id: 'n4',
          type: 'conditionNode',
          position: { x: 250, y: 440 },
          data: {
            label: 'Wait 24 Hours',
            type: 'condition',
            icon: '⏰',
            description: 'Wait 24 hours',
            config: { delay: 24, unit: 'hours' }
          }
        },
        {
          id: 'n5',
          type: 'conditionNode',
          position: { x: 250, y: 570 },
          data: {
            label: 'Purchased?',
            type: 'condition',
            icon: '🔀',
            description: 'Did they purchase?',
            config: {
              field: 'purchase_status',
              operator: 'equals',
              value: 'completed'
            }
          }
        },
        {
          id: 'n6',
          type: 'endNode',
          position: { x: 450, y: 700 },
          data: {
            label: 'Goal Reached',
            type: 'end',
            icon: '🏆',
            description: 'Purchase completed!',
            config: {}
          }
        },
        {
          id: 'n7',
          type: 'actionNode',
          position: { x: 50, y: 700 },
          data: {
            label: 'Send 10% Discount',
            type: 'action',
            icon: '🎁',
            description: 'Offer 10% discount',
            config: {
              subject: 'Here is 10% off your cart!',
              template: 'cart_discount'
            }
          }
        },
        {
          id: 'n8',
          type: 'conditionNode',
          position: { x: 50, y: 830 },
          data: {
            label: 'Wait 48 Hours',
            type: 'condition',
            icon: '⏰',
            description: 'Final wait',
            config: { delay: 48, unit: 'hours' }
          }
        },
        {
          id: 'n9',
          type: 'actionNode',
          position: { x: 50, y: 960 },
          data: {
            label: 'Final Reminder',
            type: 'action',
            icon: '📧',
            description: 'Last chance email',
            config: {
              subject: 'Last chance — cart expires soon',
              template: 'cart_final'
            }
          }
        }
      ],
      edges: [
        { id:'e1-2', source:'n1', target:'n2',
          animated:true },
        { id:'e2-3', source:'n2', target:'n3',
          animated:true },
        { id:'e3-4', source:'n3', target:'n4',
          animated:true },
        { id:'e4-5', source:'n4', target:'n5',
          animated:true },
        { id:'e5-6', source:'n5', target:'n6',
          animated:true, label:'Yes' },
        { id:'e5-7', source:'n5', target:'n7',
          animated:true, label:'No' },
        { id:'e7-8', source:'n7', target:'n8',
          animated:true },
        { id:'e8-9', source:'n8', target:'n9',
          animated:true },
      ]
    },
    {
      id: 'tpl-nurture',
      name: 'Lead Nurture Sequence',
      description: 
        'Score and nurture leads to sales-ready status',
      category: 'nurture',
      icon: '🌱',
      triggerType: 'form_submit',
      nodes: [
        {
          id: 'n1', type:'triggerNode',
          position:{ x:250, y:50 },
          data:{
            label:'New Lead', type:'trigger',
            icon:'👤', description:'New contact added',
            config:{}
          }
        },
        {
          id: 'n2', type:'actionNode',
          position:{ x:250, y:180 },
          data:{
            label:'Add Tag: New Lead', type:'action',
            icon:'🏷️', description:'Tag the contact',
            config:{ tag:'new_lead' }
          }
        },
        {
          id: 'n3', type:'actionNode',
          position:{ x:250, y:310 },
          data:{
            label:'Send Welcome Email', type:'action',
            icon:'📧', description:'Welcome the lead',
            config:{
              subject:'Welcome aboard!',
              template:'welcome'
            }
          }
        },
        {
          id: 'n4', type:'conditionNode',
          position:{ x:250, y:440 },
          data:{
            label:'Wait 3 Days', type:'condition',
            icon:'⏰', description:'Wait 3 days',
            config:{ delay:3, unit:'days' }
          }
        },
        {
          id: 'n5', type:'actionNode',
          position:{ x:250, y:570 },
          data:{
            label:'Update Score +10', type:'action',
            icon:'📊', description:'Increase lead score',
            config:{ scoreChange:10, field:'lead_score' }
          }
        },
        {
          id: 'n6', type:'actionNode',
          position:{ x:250, y:700 },
          data:{
            label:'Send Case Study', type:'action',
            icon:'📧', description:'Share success story',
            config:{
              subject:'See how we helped [Company]',
              template:'case_study'
            }
          }
        },
        {
          id: 'n7', type:'conditionNode',
          position:{ x:250, y:830 },
          data:{
            label:'Score > 50?', type:'condition',
            icon:'🔀', description:'Check lead score',
            config:{
              field:'lead_score',
              operator:'greater_than',
              value:'50'
            }
          }
        },
        {
          id: 'n8', type:'actionNode',
          position:{ x:450, y:960 },
          data:{
            label:'Create Sales Task', type:'action',
            icon:'📋', description:'Alert sales team',
            config:{ taskType:'follow_up',
              assignTo:'sales_team' }
          }
        },
        {
          id: 'n9', type:'actionNode',
          position:{ x:50, y:960 },
          data:{
            label:'Send More Content', type:'action',
            icon:'📧', description:'Continue nurturing',
            config:{
              subject:'More resources for you',
              template:'content'
            }
          }
        }
      ],
      edges:[
        {id:'e1-2',source:'n1',target:'n2',animated:true},
        {id:'e2-3',source:'n2',target:'n3',animated:true},
        {id:'e3-4',source:'n3',target:'n4',animated:true},
        {id:'e4-5',source:'n4',target:'n5',animated:true},
        {id:'e5-6',source:'n5',target:'n6',animated:true},
        {id:'e6-7',source:'n6',target:'n7',animated:true},
        {id:'e7-8',source:'n7',target:'n8',
          animated:true,label:'Yes'},
        {id:'e7-9',source:'n7',target:'n9',
          animated:true,label:'No'},
      ]
    },
    {
      id: 'tpl-reengagement',
      name: 'Re-engagement Campaign',
      description: 'Win back inactive contacts',
      category: 'reengagement',
      icon: '🔄',
      triggerType: 'scheduled',
      nodes: [
        {
          id:'n1', type:'triggerNode',
          position:{x:250,y:50},
          data:{
            label:'Inactive 30 Days', type:'trigger',
            icon:'😴', description:'Contact inactive 30+ days',
            config:{inactiveDays:30}
          }
        },
        {
          id:'n2', type:'actionNode',
          position:{x:250,y:180},
          data:{
            label:'Send We Miss You', type:'action',
            icon:'📧', description:'Re-engagement email',
            config:{
              subject:'We miss you! Here is what is new',
              template:'reengagement'
            }
          }
        },
        {
          id:'n3', type:'conditionNode',
          position:{x:250,y:310},
          data:{
            label:'Wait 3 Days', type:'condition',
            icon:'⏰', description:'Wait 3 days',
            config:{delay:3,unit:'days'}
          }
        },
        {
          id:'n4', type:'conditionNode',
          position:{x:250,y:440},
          data:{
            label:'Email Opened?', type:'condition',
            icon:'🔀', description:'Did they open?',
            config:{
              field:'email_opened',
              operator:'equals',
              value:'true'
            }
          }
        },
        {
          id:'n5', type:'actionNode',
          position:{x:450,y:570},
          data:{
            label:'Send Special Offer', type:'action',
            icon:'🎁', description:'Exclusive offer',
            config:{
              subject:'Exclusive offer for you!',
              template:'special_offer'
            }
          }
        },
        {
          id:'n6', type:'actionNode',
          position:{x:50,y:570},
          data:{
            label:'Send Final Email', type:'action',
            icon:'📧', description:'Last attempt',
            config:{
              subject:'Last message from us',
              template:'final_attempt'
            }
          }
        },
        {
          id:'n7', type:'conditionNode',
          position:{x:50,y:700},
          data:{
            label:'Wait 7 Days', type:'condition',
            icon:'⏰', description:'Final wait',
            config:{delay:7,unit:'days'}
          }
        },
        {
          id:'n8', type:'conditionNode',
          position:{x:50,y:830},
          data:{
            label:'Engaged?', type:'condition',
            icon:'🔀', description:'Any engagement?',
            config:{
              field:'engaged',
              operator:'equals',
              value:'true'
            }
          }
        },
        {
          id:'n9', type:'actionNode',
          position:{x:200,y:960},
          data:{
            label:'Continue Nurture', type:'action',
            icon:'🌱', description:'Back to nurture',
            config:{}
          }
        },
        {
          id:'n10', type:'endNode',
          position:{x:0,y:960},
          data:{
            label:'Remove from List', type:'end',
            icon:'❌', description:'Unsubscribe inactive',
            config:{}
          }
        }
      ],
      edges:[
        {id:'e1-2',source:'n1',target:'n2',animated:true},
        {id:'e2-3',source:'n2',target:'n3',animated:true},
        {id:'e3-4',source:'n3',target:'n4',animated:true},
        {id:'e4-5',source:'n4',target:'n5',
          animated:true,label:'Yes'},
        {id:'e4-6',source:'n4',target:'n6',
          animated:true,label:'No'},
        {id:'e6-7',source:'n6',target:'n7',animated:true},
        {id:'e7-8',source:'n7',target:'n8',animated:true},
        {id:'e8-9',source:'n8',target:'n9',
          animated:true,label:'Yes'},
        {id:'e8-10',source:'n8',target:'n10',
          animated:true,label:'No'},
      ]
    }
  ];
}
