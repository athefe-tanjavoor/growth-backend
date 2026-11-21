import { Request, Response, NextFunction } from 'express';
import { Package } from '../models/Package.js';
import { ApiResponse, ApiError } from '../utils/response.js';

// Fallback pricing bundles if database empty
const DEFAULT_PACKAGES = [
  {
    slug: 'growth-starter',
    order: 1,
    category: 'Digital Marketing',
    tiers: [
      { name: 'Starter', price: '$999/mo', includes: ['SEO Optimization', 'Social Media Management', 'Monthly Reporting'] },
      { name: 'Growth', price: '$2,499/mo', includes: ['Advanced SEO & Content', 'PPC Campaign Management', 'Dedicated Account Manager'] },
      { name: 'Scale', price: '$4,999/mo', includes: ['Full Funnel Marketing', 'Custom Attribution Modeling', 'Weekly Strategy Calls'] }
    ]
  }
];

export class PackagesController {
  static async getPackages(req: Request, res: Response, next: NextFunction) {
    try {
      let packages = await Package.find().sort({ order: 1 }).lean();
      if (packages.length === 0) {
        packages = DEFAULT_PACKAGES as any;
      }
      return res.status(200).json({ success: true, source: 'mongodb', data: packages });
    } catch (error) {
      next(error);
    }
  }

  static async updatePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const pkg = await Package.findOneAndUpdate(
        { slug: req.params.slug },
        req.body,
        { new: true, upsert: true }
      );
      return ApiResponse.success(res, pkg);
    } catch (error) {
      next(error);
    }
  }
}
