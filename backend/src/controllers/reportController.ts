import { Request, Response } from 'express';
import { db } from '../db';
import { campaigns, clients, workspaces, reportRequests } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/errors';

/**
 * GET /api/reports/export
 */
export const exportReport = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role } = req.user as any;
    const { format, clientId, workspaceId: queryWorkspaceId } = req.query;
    
    const targetWorkspaceId = workspaceId || queryWorkspaceId;

    if (!targetWorkspaceId && role === 'client') {
      throw new AppError('Workspace context required', 403);
    }

    let whereClause = eq(campaigns.tenantId, tenantId);
    if (targetWorkspaceId) {
      whereClause = and(whereClause, eq(campaigns.workspaceId, targetWorkspaceId)) as any;
    }
    
    if (clientId) {
      whereClause = and(whereClause, eq(campaigns.clientId, clientId as string)) as any;
    }

    const data = await db.select().from(campaigns).where(whereClause);

    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Channel', 'Budget', 'Impressions', 'Clicks', 'Conversions', 'Spend', 'Status'];
      const rows = data.map(c => [
        c.id, 
        `"${c.name}"`, 
        c.channel, 
        c.budget, 
        c.impressions, 
        c.clicks, 
        c.conversions, 
        c.spend, 
        c.status
      ].join(','));
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.csv`);
      return res.send(csvContent);
    }

    res.json(data);
  } catch (error) {
    console.error('[REPORT_EXPORT_ERROR]', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

/**
 * GET /api/client/report/pdf
 */
export const exportClientPDF = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role } = req.user as any;
    const targetWorkspaceId = workspaceId || req.query.workspaceId;

    if (!targetWorkspaceId) throw new AppError('Workspace context required', 403);

    // 1. Fetch Data
    const workspace = await db.query.workspaces.findFirst({
      where: and(eq(workspaces.id, targetWorkspaceId), eq(workspaces.tenantId, tenantId))
    });
    const data = await db.select().from(campaigns).where(and(eq(campaigns.tenantId, tenantId), eq(campaigns.workspaceId, targetWorkspaceId)));
    
    // 2. Calculate Totals
    const totals = data.reduce((acc, c) => ({
      spend: acc.spend + (c.spend || 0),
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
      conversions: acc.conversions + (c.conversions || 0)
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

    // 3. Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=workspace-report-${Date.now()}.pdf`);
    
    doc.pipe(res);

    // HEADER
    doc.fontSize(24).font('Helvetica-Bold').fillColor(workspace?.primaryColor || '#4f46e5').text(workspace?.name || 'Workspace Report', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // STATS GRID
    doc.rect(50, doc.y, 500, 80).fill('#f8fafc');
    doc.fillColor('#1e293b');
    
    const startY = doc.y + 20;
    doc.fontSize(10).font('Helvetica-Bold').text('TOTAL SPEND', 70, startY);
    doc.fontSize(18).text(`$${totals.spend.toLocaleString()}`, 70, startY + 15);

    doc.fontSize(10).text('IMPRESSIONS', 200, startY);
    doc.fontSize(18).text(totals.impressions.toLocaleString(), 200, startY + 15);

    doc.fontSize(10).text('CLICKS', 330, startY);
    doc.fontSize(18).text(totals.clicks.toLocaleString(), 330, startY + 15);

    doc.fontSize(10).text('CONVERSIONS', 460, startY);
    doc.fontSize(18).text(totals.conversions.toLocaleString(), 460, startY + 15);

    doc.moveDown(6);

    // TABLE HEADER
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a').text('Campaigns Performance');
    doc.moveDown(1);

    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#64748b');
    doc.text('Campaign Name', 50, tableTop);
    doc.text('Status', 300, tableTop);
    doc.text('Budget', 450, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e2e8f0').stroke();

    // TABLE ROWS
    let currentY = tableTop + 25;
    doc.fillColor('#334155').font('Helvetica');

    data.forEach(c => {
      if (currentY > 750) { doc.addPage(); currentY = 50; }
      doc.text(c.name, 50, currentY);
      doc.text(c.status?.toUpperCase() || 'ACTIVE', 300, currentY);
      doc.text(`$${c.budget?.toLocaleString()}`, 450, currentY);
      currentY += 25;
    });

    doc.fontSize(10).fillColor('#94a3b8').text('Generated by Digital Marketing Hub', 50, 780, { align: 'center' });
    doc.end();

  } catch (error) {
    console.error('[PDF_EXPORT_ERROR]', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};

/**
 * POST /api/client/reports/request
 */
export const requestCustomReport = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role } = req.user as any;
    const { reportType, dateFrom, dateTo, notes, clientId } = req.body;

    if (!workspaceId && role === 'client') throw new AppError('Workspace context required', 403);
    const targetWorkspaceId = workspaceId || req.body.workspaceId;
    const targetClientId = clientId || req.body.clientId;

    if (!reportType) return res.status(400).json({ message: 'Report type is required' });

    await db.insert(reportRequests).values({
      id: uuidv4(),
      tenantId,
      workspaceId: targetWorkspaceId,
      clientId: targetClientId,
      reportType,
      dateFrom,
      dateTo,
      notes,
      status: 'PENDING'
    });

    res.status(201).json({ message: 'Report request submitted successfully' });
  } catch (error) {
    console.error('[REPORT_REQUEST_ERROR]', error);
    res.status(500).json({ message: 'Error submitting report request' });
  }
};

/**
 * GET /api/admin/report-requests
 */
export const getReportRequests = async (req: Request, res: Response) => {
  try {
    const { tenantId, workspaceId, role } = req.user as any;
    const targetWorkspaceId = workspaceId || req.query.workspaceId;

    const requests = await db.select({
      id: reportRequests.id,
      reportType: reportRequests.reportType,
      dateFrom: reportRequests.dateFrom,
      dateTo: reportRequests.dateTo,
      notes: reportRequests.notes,
      status: reportRequests.status,
      createdAt: reportRequests.createdAt,
      clientName: clients.name
    })
    .from(reportRequests)
    .leftJoin(clients, eq(reportRequests.clientId, clients.id))
    .where(targetWorkspaceId 
      ? and(eq(reportRequests.tenantId, tenantId), eq(reportRequests.workspaceId, targetWorkspaceId))
      : eq(reportRequests.tenantId, tenantId)
    )
    .orderBy(sql`${reportRequests.createdAt} DESC`);

    res.json(requests);
  } catch (error) {
    console.error('[GET_REPORT_REQUESTS_ERROR]', error);
    res.status(500).json({ message: 'Error fetching report requests' });
  }
};

export const exportSingleCampaignPDF = async (req: Request, res: Response) => {
  // Simplified version for now
  res.json({ message: 'Single campaign PDF export not implemented' });
};

export const downloadClientReport = async (req: Request, res: Response) => {
  // Simplified version for now
  res.json({ message: 'Client report download not implemented' });
};
