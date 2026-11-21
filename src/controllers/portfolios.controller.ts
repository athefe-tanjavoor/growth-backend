import { Request, Response, NextFunction } from 'express';
import { Portfolio } from '../models/Portfolio.js';
import { AuditService } from '../services/audit.service.js';
import { ApiResponse, ApiError } from '../utils/response.js';

export class PortfolioController {
  static async getPublicPortfolios(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolios = await Portfolio.find({ status: 'Published' }).sort({ createdAt: -1 }).lean();
      return ApiResponse.success(res, portfolios);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminPortfolios(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolios = await Portfolio.find().sort({ createdAt: -1 }).lean();
      // Returns array directly or wrapped for compatibility with both frontends
      return res.status(200).json(portfolios);
    } catch (error) {
      next(error);
    }
  }

  static async createPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolio = new Portfolio(req.body);
      const saved = await portfolio.save();

      await AuditService.log({
        req,
        action: 'PORTFOLIO_CREATED',
        module: 'PORTFOLIO',
        resourceId: saved._id.toString(),
        details: { title: saved.title },
      });

      return res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  }

  static async updatePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await Portfolio.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) throw ApiError.notFound('Portfolio project not found');

      await AuditService.log({
        req,
        action: 'PORTFOLIO_UPDATED',
        module: 'PORTFOLIO',
        resourceId: updated._id.toString(),
        details: { title: updated.title },
      });

      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deletePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolio = await Portfolio.findById(req.params.id);
      if (!portfolio) throw ApiError.notFound('Portfolio project not found');

      await portfolio.deleteOne();

      await AuditService.log({
        req,
        action: 'PORTFOLIO_DELETED',
        module: 'PORTFOLIO',
        resourceId: portfolio._id.toString(),
        details: { title: portfolio.title },
      });

      return res.status(200).json({ success: true, message: 'Portfolio deleted' });
    } catch (error) {
      next(error);
    }
  }
}
