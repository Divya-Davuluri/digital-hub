import { Response } from 'express';
import { db } from '../db';
import { campaigns, clients } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * GET /api/reports/export
 * Query Params: format (csv|json), clientId (optional)
 */
export const exportReport = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { format, clientId } = req.query;

    let whereClause = eq(campaigns.tenantId, tenantId);
    
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

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=report-${Date.now()}.json`);
      return res.json(data);
    }

    res.json({ message: 'Requested format not yet implemented. Try format=csv or format=json' });
  } catch (error) {
    console.error('[REPORT_EXPORT_ERROR]', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};
