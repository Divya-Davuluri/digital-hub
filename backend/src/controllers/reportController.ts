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

  let query = db.select({
    id: reports.id,
    name: reports.name,
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
    roas: reports.roas
  })
  .from(reports)
  .leftJoin(workspaces, eq(reports.workspaceId, workspaces.id))
  .leftJoin(clients, eq(reports.clientId, clients.id));

  let filters = [eq(reports.tenantId, tenantId)];

  // Role-based filtering
  if (role === 'client') {
    filters.push(eq(reports.workspaceId, userWorkspaceId));
  } else if (role === 'team') {
    // Team members only see reports for clients they are assigned to
    const assignedClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.assignedTeamMemberId, userId));
    const clientIds = assignedClients.map(c => c.id);
    if (clientIds.length > 0) {
      filters.push(or(eq(reports.requestedBy, userId), inArray(reports.clientId, clientIds as string[])) as any);
    } else {
      filters.push(eq(reports.requestedBy, userId));
    }
  }

  // Query filters
  if (queryWorkspaceId) filters.push(eq(reports.workspaceId, queryWorkspaceId));
  if (clientId) filters.push(eq(reports.clientId, clientId));
  if (type && type !== 'All Types') filters.push(eq(reports.type, type.toUpperCase()));
  if (search) {
    filters.push(or(
      like(reports.name, `%${search}%`),
      like(workspaces.name, `%${search}%`),
      like(clients.name, `%${search}%`)
    ) as any);
  }

  const allReports = await query
    .where(and(...filters))
    .orderBy(sql`${reports.createdAt} DESC`);

  res.json(allReports);
});

/**
 * POST /api/reports
 */
export const createReport = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, id: userId } = req.user;
  const { name, type, period, workspaceId, clientId, campaignId, startDate, endDate } = req.body;

  if (!name || !workspaceId) {
    throw new AppError('Name and Workspace are required', 400);
  }

  // 1. Calculate Metrics from Campaigns
  let campaignQuery = db.select().from(campaigns).where(and(
    eq(campaigns.tenantId, tenantId),
    campaignId ? eq(campaigns.id, campaignId) : eq(campaigns.workspaceId, workspaceId)
  ));

  const campaignData = await campaignQuery;

  const totals = campaignData.reduce((acc, c) => ({
    spent: acc.spent + (c.spent || 0),
    impressions: acc.impressions + (c.impressions || 0),
    clicks: acc.clicks + (c.clicks || 0),
    conversions: acc.conversions + (c.conversions || 0)
  }), { spent: 0, impressions: 0, clicks: 0, conversions: 0 });

  const roas = totals.spent > 0 ? (totals.conversions * 50) / totals.spent : 0; // Simulated value

  // 2. Save Report to DB
  const reportId = uuidv4();
  const newReport = {
    id: reportId,
    tenantId,
    workspaceId,
    clientId: clientId || null,
    campaignId: campaignId || null,
    name,
    type: type || 'PERFORMANCE',
    period: period || 'Last 30 Days',
    startDate: startDate || null,
    endDate: endDate || null,
    status: 'READY',
    totalSpend: totals.spent,
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversions: totals.conversions,
    roas,
    pdfUrl: `/api/reports/${reportId}/download`,
    requestedBy: userId,
    createdAt: new Date().toISOString()
  };

  await db.insert(reports).values(newReport);

  res.status(201).json(newReport);
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
  res.json(report);
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
  res.setHeader('Content-Disposition', `attachment; filename=report-${report.name.replace(/\s+/g, '-')}.pdf`);
  doc.pipe(res);

  // PDF CONTENT
  doc.fontSize(24).font('Helvetica-Bold').text('PERFORMANCE REPORT', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(report.name, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('Report Details:');
  doc.font('Helvetica').text(`Client/Workspace: ${workspace?.name || 'N/A'}`);
  if (campaign) doc.text(`Campaign: ${campaign.name}`);
  doc.text(`Type: ${report.type}`);
  doc.text(`Period: ${report.period}`);
  doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`);
  doc.moveDown(2);

  doc.fontSize(14).font('Helvetica-Bold').text('Summary Metrics:');
  doc.rect(50, doc.y, 500, 100).stroke();
  const startY = doc.y + 20;
  doc.fontSize(10).text('TOTAL SPEND', 70, startY);
  doc.fontSize(18).text(`$${report.totalSpend?.toLocaleString()}`, 70, startY + 15);

  doc.fontSize(10).text('IMPRESSIONS', 200, startY);
  doc.fontSize(18).text(report.impressions?.toLocaleString(), 200, startY + 15);

  doc.fontSize(10).text('CLICKS', 330, startY);
  doc.fontSize(18).text(report.clicks?.toLocaleString(), 330, startY + 15);

  doc.fontSize(10).text('CONVERSIONS', 460, startY);
  doc.fontSize(18).text(report.conversions?.toLocaleString(), 460, startY + 15);

  doc.moveDown(8);
  doc.fontSize(12).font('Helvetica-Bold').text('ROAS: ' + report.roas?.toFixed(2));
  
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
