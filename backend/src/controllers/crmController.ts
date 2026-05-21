import { Response } from 'express';
import { db } from '../db';
import { contacts, workflows, workspaces, contactActivities, contactEmails, contactNotes, clients, teamAssignments } from '../db/schema';
import { eq, and, or, like, desc, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../utils/errors';
import { sendEmail } from '../utils/email';
import { WorkflowEngine } from '../utils/workflowEngine';

// 1. Get Contacts with stats and filters
export const getContacts = asyncHandler(async (req: any, res: Response) => {
  const { role, tenantId, workspaceId, id: userId, assignedClientIds } = req.user;
  const { search, status, workflowStatus, source, assignedTeamMemberId, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  // Role Access Isolation Check & Self-Healing Workspace Fallback
  let baseCondition: any = eq(contacts.tenantId, tenantId);
  
  if (role === 'team') {
    const teamWsIds: string[] = [];
    
    // Fetch workspace IDs for clients where assignedTeamMemberId = userId
    const assignedClients = await db.select({ workspaceId: clients.workspaceId })
      .from(clients)
      .where(eq(clients.assignedTeamMemberId, userId));
    assignedClients.forEach(c => teamWsIds.push(c.workspaceId));

    // Fetch workspace IDs for client assignments in req.user.assignedClientIds
    const assignedCltIds = assignedClientIds || [];
    if (assignedCltIds.length > 0) {
      const clientWorkspaces = await db.select({ workspaceId: clients.workspaceId })
        .from(clients)
        .where(inArray(clients.id, assignedCltIds));
      clientWorkspaces.forEach(c => teamWsIds.push(c.workspaceId));
    }

    // Fetch direct workspace assignments from team_assignments
    const directAssignments = await db.select({ workspaceId: teamAssignments.workspaceId })
      .from(teamAssignments)
      .where(eq(teamAssignments.userId, userId));
    directAssignments.forEach(a => teamWsIds.push(a.workspaceId));

    const uniqueWsIds = Array.from(new Set(teamWsIds)).filter(Boolean);

    baseCondition = and(
      eq(contacts.tenantId, tenantId),
      uniqueWsIds.length > 0 ? inArray(contacts.workspaceId, uniqueWsIds) : sql`1 = 0`
    );
  } else if (role !== 'admin') {
    let resolvedWorkspaceId = workspaceId;
    if (!resolvedWorkspaceId) {
      const ws = await db.select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.tenantId, tenantId))
        .limit(1);
      resolvedWorkspaceId = ws[0]?.id || 'default-workspace';
    }
    
    baseCondition = and(
      eq(contacts.tenantId, tenantId),
      eq(contacts.workspaceId, resolvedWorkspaceId)
    );
  }

  // Compile filters
  const conditions: any[] = [baseCondition];

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        like(contacts.name, searchPattern),
        like(contacts.email, searchPattern)
      )
    );
  }

  if (status) {
    conditions.push(eq(contacts.status, status));
  }

  if (workflowStatus) {
    conditions.push(eq(contacts.workflowStatus, workflowStatus));
  }

  if (source) {
    conditions.push(eq(contacts.source, source));
  }

  if (assignedTeamMemberId) {
    conditions.push(eq(contacts.assignedTeamMemberId, assignedTeamMemberId));
  }

  // Execute queries
  const allContacts = await db.select()
    .from(contacts)
    .where(and(...conditions))
    .orderBy(desc(contacts.createdAt))
    .limit(Number(limit))
    .offset(offset);

  // Compute metrics for the active filters/tenant scope
  const statsConditions = [baseCondition];
  const allTenantContacts = await db.select()
    .from(contacts)
    .where(and(...statsConditions));

  const totalContacts = allTenantContacts.length;
  const newLeads = allTenantContacts.filter(c => c.status === 'new').length;
  const enrolledLeads = allTenantContacts.filter(c => c.workflowStatus === 'enrolled').length;
  const convertedLeads = allTenantContacts.filter(c => c.status === 'converted').length;

  res.json({
    success: true,
    data: allContacts,
    pagination: {
      total: totalContacts,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalContacts / Number(limit))
    },
    stats: {
      totalContacts,
      newLeads,
      enrolledLeads,
      convertedLeads
    }
  });
});

// 2. Get Contact details
export const getContact = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId, role, id: userId, assignedClientIds } = req.user;

  const contactList = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1);

  if (contactList.length === 0) {
    throw new AppError('Contact not found', 404);
  }

  const contact = contactList[0];

  // Team permission validation
  if (role === 'team') {
    const teamWsIds: string[] = [];
    const assignedClients = await db.select({ workspaceId: clients.workspaceId })
      .from(clients)
      .where(eq(clients.assignedTeamMemberId, userId));
    assignedClients.forEach(c => teamWsIds.push(c.workspaceId));

    const assignedCltIds = assignedClientIds || [];
    if (assignedCltIds.length > 0) {
      const clientWorkspaces = await db.select({ workspaceId: clients.workspaceId })
        .from(clients)
        .where(inArray(clients.id, assignedCltIds));
      clientWorkspaces.forEach(c => teamWsIds.push(c.workspaceId));
    }

    const directAssignments = await db.select({ workspaceId: teamAssignments.workspaceId })
      .from(teamAssignments)
      .where(eq(teamAssignments.userId, userId));
    directAssignments.forEach(a => teamWsIds.push(a.workspaceId));

    const uniqueWsIds = Array.from(new Set(teamWsIds)).filter(Boolean);

    if (!uniqueWsIds.includes(contact.workspaceId || '')) {
      throw new AppError('Access denied to this contact', 403);
    }
  } else if (role !== 'admin' && contact.workspaceId !== req.user.workspaceId) {
    throw new AppError('Access denied', 403);
  }

  // Fetch activities
  const activities = await db.select()
    .from(contactActivities)
    .where(eq(contactActivities.contactId, id))
    .orderBy(desc(contactActivities.createdAt));

  // Fetch emails
  const emails = await db.select()
    .from(contactEmails)
    .where(eq(contactEmails.contactId, id))
    .orderBy(desc(contactEmails.sentAt));

  // Fetch notes
  const notes = await db.select()
    .from(contactNotes)
    .where(eq(contactNotes.contactId, id))
    .orderBy(desc(contactNotes.createdAt));

  // Fetch workflows
  let linkedWorkflows: any[] = [];
  if (contact.workflowId) {
    const flow = await db.select()
      .from(workflows)
      .where(and(eq(workflows.id, contact.workflowId), eq(workflows.tenantId, tenantId)))
      .limit(1);
    if (flow.length > 0) {
      linkedWorkflows.push({
        id: flow[0].id,
        name: flow[0].name,
        status: contact.workflowStatus || 'enrolled',
        currentStep: contact.workflowStatus === 'completed' ? 'Flow Complete' : 'Delay Wait / Welcome Series',
        completedAt: contact.workflowStatus === 'completed' ? contact.updatedAt : null,
      });
    }
  }

  res.json({
    success: true,
    data: {
      ...contact,
      activities,
      emails,
      notes,
      workflows: linkedWorkflows
    }
  });
});

// 3. Create Contact manually
export const createContact = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId } = req.user;
  const { name, email, phone, company, source, status, leadScore, tags, message, assignedTeamMemberId } = req.body;

  if (!name?.trim() || !email?.trim()) {
    throw new AppError('Name and email are required', 400);
  }

  // Self-heal workspace id context if missing (e.g. for admin user creation)
  let resolvedWorkspaceId = workspaceId;
  if (!resolvedWorkspaceId) {
    const ws = await db.select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.tenantId, tenantId))
      .limit(1);
    resolvedWorkspaceId = ws[0]?.id || 'default-workspace';
  }

  // Deduplication check scoped under the resolved workspace
  const existing = await db.select()
    .from(contacts)
    .where(and(
      eq(contacts.email, email.trim().toLowerCase()),
      eq(contacts.workspaceId, resolvedWorkspaceId)
    ))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError('Contact with this email already exists in this workspace', 400);
  }

  const id = uuidv4();
  await db.insert(contacts).values({
    id,
    tenantId,
    workspaceId: resolvedWorkspaceId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone || null,
    company: company || null,
    source: source || 'manual',
    status: status || 'new',
    leadScore: Number(leadScore) || 0,
    tags: tags || '',
    message: message || null,
    assignedTeamMemberId: assignedTeamMemberId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const created = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);

  // Log Activity
  try {
    await db.insert(contactActivities).values({
      id: uuidv4(),
      tenantId,
      workspaceId: resolvedWorkspaceId,
      contactId: id,
      activityType: 'created',
      activityMessage: `Contact was created manually by ${req.user.name || 'system'}.`
    });
  } catch (err: any) {
    console.error('Failed to log activity:', err.message);
  }

  res.status(201).json({
    success: true,
    data: created[0]
  });
});

// 4. Update Contact
export const updateContact = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId, workspaceId } = req.user;
  const { name, email, phone, company, source, status, leadScore, tags, message, workflowStatus, assignedTeamMemberId } = req.body;

  const existing = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1);

  if (existing.length === 0) {
    throw new AppError('Contact not found', 404);
  }

  // Deduplication check if email is changed
  if (email && email.trim().toLowerCase() !== existing[0].email) {
    const resolvedWorkspaceId = workspaceId || existing[0].workspaceId || 'default-workspace';
    const dup = await db.select()
      .from(contacts)
      .where(and(
        eq(contacts.email, email.trim().toLowerCase()),
        eq(contacts.workspaceId, resolvedWorkspaceId)
      ))
      .limit(1);
    if (dup.length > 0) {
      throw new AppError('Email already in use by another contact in this workspace', 400);
    }
  }

  const updateData: any = {
    updatedAt: new Date().toISOString()
  };

  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (phone !== undefined) updateData.phone = phone || null;
  if (company !== undefined) updateData.company = company || null;
  if (source !== undefined) updateData.source = source || 'manual';
  if (status !== undefined) updateData.status = status || 'new';
  if (leadScore !== undefined) updateData.leadScore = Number(leadScore) || 0;
  if (tags !== undefined) updateData.tags = tags || '';
  if (message !== undefined) updateData.message = message || null;
  if (workflowStatus !== undefined) updateData.workflowStatus = workflowStatus || null;
  if (assignedTeamMemberId !== undefined) updateData.assignedTeamMemberId = assignedTeamMemberId || null;

  await db.update(contacts)
    .set(updateData)
    .where(eq(contacts.id, id));

  const updated = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);

  res.json({
    success: true,
    data: updated[0]
  });
});

// 5. Delete Contact
export const deleteContact = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  const existing = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1);

  if (existing.length === 0) {
    throw new AppError('Contact not found', 404);
  }

  await db.delete(contacts).where(eq(contacts.id, id));

  res.json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

// 6. Add Tag
export const addTag = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tag } = req.body;
  const { tenantId } = req.user;

  if (!tag?.trim()) {
    throw new AppError('Tag is required', 400);
  }

  const contactList = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1);

  if (contactList.length === 0) {
    throw new AppError('Contact not found', 404);
  }

  const contact = contactList[0];
  const currentTags = contact.tags ? contact.tags.split(',').map(t => t.trim()) : [];
  
  if (!currentTags.includes(tag.trim())) {
    currentTags.push(tag.trim());
  }

  const updatedTags = currentTags.join(', ');

  await db.update(contacts)
    .set({
      tags: updatedTags,
      updatedAt: new Date().toISOString()
    })
    .where(eq(contacts.id, id));

  // Log Activity
  try {
    await db.insert(contactActivities).values({
      id: uuidv4(),
      tenantId,
      workspaceId: contact.workspaceId || 'default-workspace',
      contactId: id,
      activityType: 'tags_updated',
      activityMessage: `Tag "${tag.trim()}" was added. All tags: ${updatedTags}`
    });
  } catch (err: any) {
    console.error('Failed to log tag activity:', err.message);
  }

  res.json({
    success: true,
    tags: updatedTags,
    message: 'Tag added successfully'
  });
});

// 7. Mark Converted
export const markConverted = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  const contactList = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1);

  if (contactList.length === 0) {
    throw new AppError('Contact not found', 404);
  }

  await db.update(contacts)
    .set({
      status: 'converted',
      leadScore: sql`${contacts.leadScore} + 40`, // Add conversion points
      updatedAt: new Date().toISOString()
    })
    .where(eq(contacts.id, id));

  // Log Activity
  try {
    await db.insert(contactActivities).values({
      id: uuidv4(),
      tenantId,
      workspaceId: contactList[0].workspaceId || 'default-workspace',
      contactId: id,
      activityType: 'lead_converted',
      activityMessage: `Lead status updated to Converted. Lead score boosted by +40.`
    });
  } catch (err: any) {
    console.error('Failed to log lead conversion activity:', err.message);
  }

  res.json({
    success: true,
    message: 'Contact marked as converted successfully'
  });
});

// 8. Enroll in Workflow manually
export const enrollInWorkflow = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { workflowId } = req.body;
  const { tenantId } = req.user;

  if (!workflowId) {
    throw new AppError('Workflow ID is required', 400);
  }

  const contactList = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1);

  if (contactList.length === 0) {
    throw new AppError('Contact not found', 404);
  }

  const workflowList = await db.select()
    .from(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId)))
    .limit(1);

  if (workflowList.length === 0) {
    throw new AppError('Workflow not found or not within active scope', 404);
  }

  const flow = workflowList[0];
  const contact = contactList[0];

  // 1. Update workflow metrics
  const currentEnrolled = (flow.enrolledCount || 0) + 1;
  await db.update(workflows)
    .set({
      enrolledCount: currentEnrolled,
      lastRunAt: new Date().toISOString()
    })
    .where(eq(workflows.id, flow.id));

  // 2. Update contact workflow status
  await db.update(contacts)
    .set({
      workflowId: flow.id,
      workflowStatus: 'enrolled',
      updatedAt: new Date().toISOString()
    })
    .where(eq(contacts.id, id));

  // Log Activity
  try {
    await db.insert(contactActivities).values({
      id: uuidv4(),
      tenantId,
      workspaceId: contact.workspaceId || 'default-workspace',
      contactId: id,
      activityType: 'workflow_started',
      activityMessage: `Contact enrolled in automation workflow: "${flow.name}".`
    });
  } catch (err: any) {
    console.error('Failed to log workflow enrollment activity:', err.message);
  }

  console.log(`[CRM_ENROLLMENT] Contact ${contact.email} manually enrolled in workflow: ${flow.name}`);

  // 3. Trigger execution in background
  await WorkflowEngine.enrollContact(flow.id, contact.id);

  res.json({
    success: true,
    message: `Contact successfully enrolled in ${flow.name}`
  });
});

// 9. Add note to contact
export const createNote = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params; // contactId
  const { content } = req.body;
  const { tenantId, workspaceId, id: userId, name: userName } = req.user;

  if (!content?.trim()) {
    throw new AppError('Content is required', 400);
  }

  const contactList = await db.select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1);

  if (contactList.length === 0) {
    throw new AppError('Contact not found', 404);
  }

  const noteId = uuidv4();
  await db.insert(contactNotes).values({
    id: noteId,
    tenantId,
    workspaceId: contactList[0].workspaceId || workspaceId || 'default-workspace',
    contactId: id,
    content: content.trim(),
    createdBy: userId,
    createdByName: userName || 'Team Member',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Log activity
  try {
    await db.insert(contactActivities).values({
      id: uuidv4(),
      tenantId,
      workspaceId: contactList[0].workspaceId || workspaceId || 'default-workspace',
      contactId: id,
      activityType: 'note_added',
      activityMessage: `Note added by ${userName || 'Team Member'}: "${content.trim().substring(0, 60)}..."`
    });
  } catch (err: any) {
    console.error('Failed to log note activity:', err.message);
  }

  const created = await db.select().from(contactNotes).where(eq(contactNotes.id, noteId)).limit(1);

  res.status(201).json({
    success: true,
    data: created[0]
  });
});

// 10. Update note
export const updateNote = asyncHandler(async (req: any, res: Response) => {
  const { noteId } = req.params;
  const { content } = req.body;
  const { tenantId } = req.user;

  if (!content?.trim()) {
    throw new AppError('Content is required', 400);
  }

  const existingNote = await db.select()
    .from(contactNotes)
    .where(and(eq(contactNotes.id, noteId), eq(contactNotes.tenantId, tenantId)))
    .limit(1);

  if (existingNote.length === 0) {
    throw new AppError('Note not found', 404);
  }

  await db.update(contactNotes)
    .set({
      content: content.trim(),
      updatedAt: new Date().toISOString()
    })
    .where(eq(contactNotes.id, noteId));

  res.json({
    success: true,
    message: 'Note updated successfully'
  });
});

// 11. Delete note
export const deleteNote = asyncHandler(async (req: any, res: Response) => {
  const { noteId } = req.params;
  const { tenantId } = req.user;

  const existingNote = await db.select()
    .from(contactNotes)
    .where(and(eq(contactNotes.id, noteId), eq(contactNotes.tenantId, tenantId)))
    .limit(1);

  if (existingNote.length === 0) {
    throw new AppError('Note not found', 404);
  }

  await db.delete(contactNotes).where(eq(contactNotes.id, noteId));

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
});
