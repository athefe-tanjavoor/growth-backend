import { Request, Response, NextFunction } from 'express';
import { Blog } from '../models/Blog.js';
import { Lead } from '../models/Lead.js';
import { Portfolio } from '../models/Portfolio.js';
import { ApiResponse } from '../utils/response.js';

export class AnalyticsController {
  static async getDashboardOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const days = parseInt((req.query.days as string) || '7', 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const previousCutoff = new Date(cutoffDate);
      previousCutoff.setDate(previousCutoff.getDate() - days);

      const [
        totalBlogs,
        publishedBlogs,
        totalLeads,
        totalPortfolio,
        recentLeads,
        recentBlogs,
        recentPortfolio,
        leadsCurrentPeriod,
        leadsPreviousPeriod,
      ] = await Promise.all([
        Blog.countDocuments(),
        Blog.countDocuments({ status: 'published' }),
        Lead.countDocuments(),
        Portfolio.countDocuments(),
        Lead.find().sort({ createdAt: -1 }).limit(5).lean(),
        Blog.find().sort({ createdAt: -1 }).limit(5).select('title slug status category createdAt views').lean(),
        Portfolio.find().sort({ createdAt: -1 }).limit(5).lean(),
        Lead.countDocuments({ createdAt: { $gte: cutoffDate } }),
        Lead.countDocuments({ createdAt: { $gte: previousCutoff, $lt: cutoffDate } }),
      ]);

      const leadGrowthPercent = leadsPreviousPeriod === 0
        ? leadsCurrentPeriod > 0 ? 100 : 0
        : Math.round(((leadsCurrentPeriod - leadsPreviousPeriod) / leadsPreviousPeriod) * 100);

      const stats = {
        totalBlogs,
        publishedBlogs,
        contactLeads: totalLeads,
        portfolioProjects: totalPortfolio,
        leadsGrowth: {
          currentPeriodCount: leadsCurrentPeriod,
          percent: leadGrowthPercent,
          text: `${leadGrowthPercent >= 0 ? '+' : ''}${leadGrowthPercent}% vs previous ${days} days`,
        },
      };

      return ApiResponse.success(res, {
        stats,
        recentLeads,
        recentBlogs,
        recentPortfolio,
      });
    } catch (error) {
      next(error);
    }
  }
}
