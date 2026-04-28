import { Request, Response } from 'express';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Analytics data as requested
    const dashboardData = {
      totalCampaigns: 12,
      activeUsers: 5,
      revenue: 1200,
      performance: 85
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};
