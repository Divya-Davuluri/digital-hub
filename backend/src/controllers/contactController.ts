import { Request, Response } from 'express';
import { db } from '../db';
import { contacts, workflows, tenants, workspaces, contactActivities, contactEmails } from '../db/schema';
import { sendEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';
import { sql, eq, and } from 'drizzle-orm';
import { asyncHandler } from '../utils/errors';
import { WorkflowEngine } from '../utils/workflowEngine';

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

  // Enroll in active workflows
  if (activeWorkflows.length > 0) {
    for (const flow of activeWorkflows) {
      await WorkflowEngine.enrollContact(flow.id, contactId);
    }
  } else {
    console.log('[WORKFLOW_ENGINE] No active workflows found for contact enrollment.');
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for contacting us! Your message has been received.',
    contactId
  });
});

