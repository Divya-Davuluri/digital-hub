import { Request, Response } from 'express';
import { db } from '../db';
import { campaigns, clients, workspaces, reports, users } from '../db/schema';
import { eq, and, sql, or, like, inArray } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';

/**
 * GET /api/reports
 */
export const getReports = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, workspaceId: userWorkspaceId, role, id: userId } = req.user;
  const { search, type, period, workspaceId: queryWorkspaceId, clientId } = req.query;

  console.log('[GET_REPORTS_QUERY]', { role, tenantId, search, type, period });

  let query = db.select({
    id: reports.id,
    report_name: reports.report_name,
    client_name: reports.client_name,
    campaign: reports.campaign,
    type: reports.type,
    period: reports.period,
    status: reports.status,
    createdAt: reports.createdAt,
    workspaceName: workspaces.name,
    clientName: clients.name,
    totalSpend: reports.totalSpend,
    impressions: reports.impressions,
    clicks: reports.clicks,
    conversions: reports.conversions,
    roas: reports.roas,
    file_url: reports.file_url
  })
  .from(reports)
  .leftJoin(workspaces, eq(reports.workspaceId, workspaces.id))
  .leftJoin(clients, eq(reports.clientId, clients.id));

  let filters = [eq(reports.tenantId, tenantId)];

  // Role-based filtering
  if (role === 'client') {
    filters.push(eq(reports.workspaceId, userWorkspaceId));
  } else if (role === 'team') {
    const assignedClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.assignedTeamMemberId, userId));
    const clientIds = assignedClients.map(c => c.id);
    if (clientIds.length > 0) {
      filters.push(or(eq(reports.requestedBy, userId), inArray(reports.clientId, clientIds as string[])) as any);
    } else {
      filters.push(eq(reports.requestedBy, userId));
    }
  }

  // Query filters
  if (queryWorkspaceId && queryWorkspaceId !== 'undefined' && queryWorkspaceId !== 'null') {
    filters.push(eq(reports.workspaceId, queryWorkspaceId));
  }
  if (clientId && clientId !== 'undefined' && clientId !== 'null') {
    filters.push(eq(reports.clientId, clientId));
  }
  if (type && type !== 'All Types') {
    filters.push(eq(reports.type, type.toUpperCase()));
  }
  if (period && period !== 'All Time' && period !== 'Last 30 Days' && period !== 'Last 7 Days') {
    filters.push(eq(reports.period, period));
  } else if (period && period !== 'All Time') {
    filters.push(eq(reports.period, period));
  }
  
  if (search) {
    filters.push(or(
      like(reports.report_name, `%${search}%`),
      like(workspaces.name, `%${search}%`),
      like(clients.name, `%${search}%`)
    ) as any);
  }

  const allReports = await query
    .where(and(...filters))
    .orderBy(sql`${reports.createdAt} DESC`);

  console.log('[GET_REPORTS_COUNT]', allReports.length);
  res.json({ success: true, reports: allReports });
});

/**
 * POST /api/reports
 */
export const createReport = asyncHandler(async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { 
    report_name: reportName, 
    report_type: type, 
    period, 
    client_id: clientId, 
    campaign_id: campaignId,
    client_name: clientName,
    campaign 
  } = req.body;

  console.log('generateReport called with:', {
    tenantId,
    clientId,
    reportName,
    type,
    period
  });

  try {
    const reportId = uuidv4();

    // Calculate dates from period
    const endDate = new Date();
    const startDate = new Date();
    if (period === 'Last 7 Days') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'Last 30 Days') startDate.setDate(startDate.getDate() - 30);
    else if (period === 'Last 90 Days') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 30);

    // Get workspace from clientId - Simplified lookup (Fix 1)
    let workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.clientId, clientId)
    });

    console.log('Workspace found:', workspace);

    // Fallback: Create workspace if missing (Fix 2)
    if (!workspace) {
      console.log('Workspace not found. Attempting to create one for clientId:', clientId);
      
      // Get client details to create workspace
      const client = await db.query.clients.findFirst({
        where: eq(clients.id, clientId)
      });
      
      if (!client) {
        throw new AppError(`Client not found for clientId: ${clientId}`, 404);
      }
      
      const workspaceId = uuidv4();
      await db.insert(workspaces).values({
        id: workspaceId,
        tenantId,
        clientId,
        name: client.name,
        slug: client.name.toLowerCase().replace(/\s+/g, '-'),
        settings: JSON.stringify({
          theme: 'light',
          modules: ['campaigns', 'analytics', 'reports', 'creatives']
        }),
        createdAt: new Date().toISOString(),
      });
      
      workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.id, workspaceId)
      });
      
      console.log('Workspace created on-the-fly:', workspace?.id);
    }

    if (!workspace) {
       throw new AppError(`Workspace not found and could not be created for clientId: ${clientId}`, 404);
    }

    await db.insert(reports).values({
      id: reportId,
      tenantId,
      workspaceId: workspace.id,
      clientId: clientId || null,
      campaignId: campaignId || null,
      report_name: reportName,
      client_name: clientName || null,
      campaign: campaign || 'All Campaigns',
      type: type || 'PERFORMANCE',
      period: period || 'Last 30 Days',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'completed',
      totalSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      roas: 0,
      file_url: `/api/reports/${reportId}/download`,
      requestedBy: req.user?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const newReport = await db.query.reports.findFirst({
      where: eq(reports.id, reportId)
    });

    return res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: newReport
    });

  } catch (err: any) {
    console.error('Report generation failed:', err);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  }
});

/**
 * GET /api/reports/:id
 */
export const getReportById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  const report = await db.query.reports.findFirst({
    where: and(eq(reports.id, id), eq(reports.tenantId, tenantId))
  });

  if (!report) throw new AppError('Report not found', 404);
  res.json({ success: true, report });
});

/**
 * GET /api/reports/:id/download
 */
export const downloadReport = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  const report = await db.query.reports.findFirst({
    where: and(eq(reports.id, id), eq(reports.tenantId, tenantId))
  });

  if (!report) throw new AppError('Report not found', 404);

  // Fetch context names
  const workspace = await db.query.workspaces.findFirst({ where: eq(workspaces.id, report.workspaceId) });
  const campaign = report.campaignId ? await db.query.campaigns.findFirst({ where: eq(campaigns.id, report.campaignId) }) : null;

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-${report.report_name.replace(/\s+/g, '-')}.pdf`);
  doc.pipe(res);

  // PDF CONTENT
  doc.fontSize(24).font('Helvetica-Bold').text('PERFORMANCE REPORT', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(report.report_name, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('Report Details:');
  doc.font('Helvetica').text(`Client/Workspace: ${report.client_name || workspace?.name || 'N/A'}`);
  doc.text(`Campaign: ${report.campaign || 'All Campaigns'}`);
  doc.text(`Type: ${report.type}`);
  doc.text(`Period: ${report.period}`);
  doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`);
  doc.moveDown(2);

  doc.fontSize(14).font('Helvetica-Bold').text('Summary Metrics:');
  doc.rect(50, doc.y, 500, 100).stroke();
  const startY = doc.y + 20;
  doc.fontSize(10).text('TOTAL SPEND', 70, startY);
  doc.fontSize(18).text(`$${(report.totalSpend || 0).toLocaleString()}`, 70, startY + 15);

  doc.fontSize(10).text('IMPRESSIONS', 200, startY);
  doc.fontSize(18).text((report.impressions || 0).toLocaleString(), 200, startY + 15);

  doc.fontSize(10).text('CLICKS', 330, startY);
  doc.fontSize(18).text((report.clicks || 0).toLocaleString(), 330, startY + 15);

  doc.fontSize(10).text('CONVERSIONS', 460, startY);
  doc.fontSize(18).text((report.conversions || 0).toLocaleString(), 460, startY + 15);

  doc.moveDown(8);
  doc.fontSize(12).font('Helvetica-Bold').text('ROAS: ' + (report.roas || 0).toFixed(2));
  
  doc.moveDown(4);
  doc.fontSize(10).font('Helvetica').text('Generated by Digital Marketing Hub', { align: 'center' });

  doc.end();
});

/**
 * DELETE /api/reports/:id
 */
export const deleteReport = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { tenantId } = req.user;

  await db.delete(reports).where(and(eq(reports.id, id), eq(reports.tenantId, tenantId)));
  res.json({ success: true, message: 'Report deleted' });
});

// Legacy exports for compatibility
export const exportReport = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy. Use new report endpoints.' });
export const requestCustomReport = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy. Use new report endpoints.' });
export const getReportRequests = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy. Use new report endpoints.' });
export const exportClientPDF = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy. Use new report endpoints.' });
export const updateReportRequestStatus = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy. Use new report endpoints.' });
