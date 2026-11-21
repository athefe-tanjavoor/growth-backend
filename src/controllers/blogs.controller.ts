import { Request, Response, NextFunction } from 'express';
import { Blog } from '../models/Blog.js';
import { AuditService } from '../services/audit.service.js';
import { ApiResponse, ApiError } from '../utils/response.js';

export class BlogsController {
  // Public Endpoint: List published blogs for the public site
  static async getPublishedBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, tag, search, page = '1', limit = '50' } = req.query;
      const query: any = { status: 'published' };

      if (category && category !== 'All') {
        query.category = category;
      }
      if (tag) {
        query.tags = tag;
      }
      if (search) {
        const regex = { $regex: search as string, $options: 'i' };
        query.$or = [{ title: regex }, { excerpt: regex }, { tags: regex }];
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .select('-content') // Keep list payloads fast
          .populate('author', 'name avatar')
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Blog.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        blogs,
        data: blogs,
        meta: { total, page: pageNum, limit: limitNum },
      });
    } catch (error) {
      next(error);
    }
  }

  // Public Endpoint: Single blog article by slug
  static async getBlogBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const blog = await Blog.findOne({ slug, status: 'published' }).populate('author', 'name avatar');

      if (!blog) throw ApiError.notFound('Blog article not found');

      // Increment view count asynchronously
      Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).exec();

      return ApiResponse.success(res, { blog });
    } catch (error) {
      next(error);
    }
  }

  // Admin: List all blogs (including drafts & archived)
  static async getAdminBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, category, search } = req.query;
      const query: any = {};

      if (status && status !== 'all') query.status = status;
      if (category && category !== 'All') query.category = category;
      if (search) {
        const regex = { $regex: search as string, $options: 'i' };
        query.$or = [{ title: regex }, { excerpt: regex }];
      }

      const blogs = await Blog.find(query)
        .select('-content')
        .populate('author', 'name email avatar')
        .sort({ createdAt: -1 })
        .lean();

      // Legacy admin compatibility: { success: true, blogs }
      return res.status(200).json({
        success: true,
        blogs,
        data: blogs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBlogById(req: Request, res: Response, next: NextFunction) {
    try {
      const blog = await Blog.findById(req.params.id).populate('author', 'name email avatar');
      if (!blog) throw ApiError.notFound('Blog not found');

      return res.status(200).json({
        success: true,
        blog,
        data: blog,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blogData = {
        ...req.body,
        author: req.user!._id,
        publishedAt: req.body.status === 'published' ? new Date() : undefined,
      };

      const blog = new Blog(blogData);
      await blog.save();

      await AuditService.log({
        req,
        action: 'BLOG_CREATED',
        module: 'BLOGS',
        resourceId: blog._id.toString(),
        details: { title: blog.title, status: blog.status, slug: blog.slug },
      });

      return res.status(201).json({
        success: true,
        blog,
        data: blog,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return next(ApiError.conflict('A blog with this slug already exists. Please choose a unique slug.'));
      }
      next(error);
    }
  }

  static async updateBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) throw ApiError.notFound('Blog not found');

      const oldStatus = blog.status;
      const updates = { ...req.body };

      if (updates.status === 'published' && oldStatus !== 'published') {
        updates.publishedAt = new Date();
      }

      const updated = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true });

      await AuditService.log({
        req,
        action: 'BLOG_UPDATED',
        module: 'BLOGS',
        resourceId: blog._id.toString(),
        details: { title: blog.title, oldStatus, newStatus: updates.status },
      });

      return res.status(200).json({
        success: true,
        blog: updated,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) throw ApiError.notFound('Blog not found');

      await blog.deleteOne();

      await AuditService.log({
        req,
        action: 'BLOG_DELETED',
        module: 'BLOGS',
        resourceId: blog._id.toString(),
        details: { title: blog.title, slug: blog.slug },
      });

      return res.status(200).json({
        success: true,
        message: 'Blog deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
