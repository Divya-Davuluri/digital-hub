import { Request, Response } from 'express';
import { db } from '../db';
import { campaigns, clients, workspaces, reports, users } from '../db/schema';
import { eq, and, sql, or, like, inArray, desc } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';

/**
 * GET /api/reports
 */
export const getReports = asyncHandler(async (req: any, res: Response) => {
  const { tenantId, role, id: userId, workspaceId: userWorkspaceId } = req.user;
  const { search, type, period } = req.query;

  console.log('Fetching reports for tenantId:', tenantId, 'Role:', role);

  try {
    let filters = [eq(reports.tenantId, tenantId)];

    // Role-based filtering
    if (role === 'client') {
      filters.push(eq(reports.workspaceId, userWorkspaceId));
    } else if (role === 'team') {
      const assignedClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.assignedTeamMemberId, userId));
      const clientIds = assignedClients.map(c => c.id);
      const teamAssignedCltIds = req.user.assignedClientIds || [];
      const allClientIds = Array.from(new Set([...clientIds, ...teamAssignedCltIds]));
      
      if (allClientIds.length > 0) {
        filters.push(or(eq(reports.requestedBy, userId), inArray(reports.clientId, allClientIds as string[])) as any);
      } else {
        filters.push(eq(reports.requestedBy, userId));
      }
    }

    if (type && type !== 'All Types') {
      filters.push(eq(reports.type, type.toUpperCase()));
    }
    
    if (search) {
      filters.push(like(reports.report_name, `%${search}%`) as any);
    }

    // FIX 2: Join with clients to get real client name
    const allReports = await db
      .select({
        id: reports.id,
        report_name: reports.report_name,
        name: reports.name,
        client_name: reports.client_name,
        clientName: clients.name, // Real client name from join
        campaign: reports.campaign,
        type: reports.type,
        period: reports.period,
        status: reports.status,
        createdAt: reports.createdAt,
        totalSpend: reports.totalSpend,
        impressions: reports.impressions,
        clicks: reports.clicks,
        conversions: reports.conversions,
        roas: reports.roas,
        file_url: reports.file_url,
        url: reports.url
      })
      .from(reports)
      .leftJoin(clients, eq(reports.clientId, clients.id))
      .where(and(...filters))
      .orderBy(desc(reports.createdAt));

    console.log('Reports found:', allReports.length);
    
    res.json({
      success: true,
      reports: allReports
    });

  } catch (err) {
    console.error('Failed to fetch reports:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
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

  console.log('generateReport called with:', { tenantId, clientId, reportName, type, period });

  try {
    const reportId = uuidv4();

    // Calculate dates from period
    const endDate = new Date();
    const startDate = new Date();
    if (period === 'Last 7 Days') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'Last 30 Days') startDate.setDate(startDate.getDate() - 30);
    else if (period === 'Last 90 Days') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 30);

    // Get workspace from clientId
    let workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.clientId, clientId)
    });

    if (!workspace) {
      const client = await db.query.clients.findFirst({ where: eq(clients.id, clientId) });
      if (!client) throw new AppError(`Client not found for clientId: ${clientId}`, 404);
      
      const workspaceId = uuidv4();
      await db.insert(workspaces).values({
        id: workspaceId,
        tenantId,
        clientId,
        name: client.name,
        slug: client.name.toLowerCase().replace(/\s+/g, '-'),
        status: 'active',
        primaryColor: '#4f46e5',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      workspace = await db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) });
    }

    if (!workspace) throw new AppError(`Workspace resolution failed for clientId: ${clientId}`, 404);

    // FIX 3: Ensure period is always saved
    await db.insert(reports).values({
      id: reportId,
      tenantId,
      workspaceId: workspace.id,
      clientId: clientId || null,
      campaignId: campaignId || null,
      name: reportName,
      url: `/api/reports/${reportId}/download`,
      report_name: reportName,
      client_name: clientName || null,
      campaign: campaign || 'All Campaigns',
      type: type || 'PERFORMANCE',
      period: period || 'Last 30 Days', // Fallback
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

    const newReport = await db.query.reports.findFirst({ where: eq(reports.id, reportId) });

    return res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: newReport
    });

  } catch (err: any) {
    console.error('Report generation failed:', err);
    res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
});

/**
 * Helper to validate if user has access to a report
 */
const validateReportAccess = async (report: any, req: any) => {
  const { role, id: userId, workspaceId: userWorkspaceId, assignedClientIds } = req.user;
  if (role === 'admin') return true;
  
  if (role === 'client') {
    return report.workspaceId === userWorkspaceId;
  }
  
  if (role === 'team') {
    if (report.requestedBy === userId) return true;
    if (!report.clientId) return false;
    
    const assignedClients = await db.select({ id: clients.id }).from(clients).where(eq(clients.assignedTeamMemberId, userId));
    const clientIds = assignedClients.map(c => c.id);
    const teamAssignedCltIds = assignedClientIds || [];
    const allClientIds = Array.from(new Set([...clientIds, ...teamAssignedCltIds]));
    
    return allClientIds.includes(report.clientId);
  }
  
  return false;
};

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
  
  const hasAccess = await validateReportAccess(report, req);
  if (!hasAccess) throw new AppError('Access denied to this report', 403);

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

  const hasAccess = await validateReportAccess(report, req);
  if (!hasAccess) throw new AppError('Access denied to download this report', 403);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-${report.report_name.replace(/\s+/g, '-')}.pdf`);
  doc.pipe(res);

  doc.fontSize(24).font('Helvetica-Bold').text('PERFORMANCE REPORT', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(report.report_name, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('Report Details:');
  doc.font('Helvetica').text(`Client: ${report.client_name || 'N/A'}`);
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

  const report = await db.query.reports.findFirst({
    where: and(eq(reports.id, id), eq(reports.tenantId, tenantId))
  });

  if (!report) throw new AppError('Report not found', 404);

  const hasAccess = await validateReportAccess(report, req);
  if (!hasAccess) throw new AppError('Access denied to delete this report', 403);

  await db.delete(reports).where(and(eq(reports.id, id), eq(reports.tenantId, tenantId)));
  res.json({ success: true, message: 'Report deleted' });
});

// Legacy exports
export const exportReport = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy' });
export const requestCustomReport = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy' });
export const getReportRequests = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy' });
export const exportClientPDF = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy' });
export const updateReportRequestStatus = (req: Request, res: Response) => res.status(501).json({ message: 'Legacy' });
