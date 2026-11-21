import { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/Lead.js';
import { AuditService } from '../services/audit.service.js';
import { ApiResponse, ApiError } from '../utils/response.js';

export class LeadsController {
  // Public Endpoint: Website contact form submission
  static async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, businessName, service, message } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const lead = await Lead.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        businessName: businessName ? businessName.trim() : '',
        service: service.trim(),
        message: message.trim(),
        status: 'new',
        ipAddress,
        userAgent,
      });

      await AuditService.log({
        req,
        action: 'LEAD_CREATED_PUBLIC',
        module: 'LEADS',
        resourceId: lead._id.toString(),
        details: { name: lead.name, email: lead.email, service: lead.service },
      });

      return ApiResponse.created(
        res,
        { id: lead._id },
        'Thank you! Your message has been sent successfully.'
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin: List leads with search, filter, pagination
  static async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, page = '1', limit = '50' } = req.query;
      const query: any = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (search) {
        const regex = { $regex: search as string, $options: 'i' };
        query.$or = [{ name: regex }, { email: regex }, { businessName: regex }, { service: regex }];
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [leads, total] = await Promise.all([
        Lead.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('assignedTo', 'name email')
          .lean(),
        Lead.countDocuments(query),
      ]);

      // Backward compatibility: legacy frontend expects { success: true, leads }
      return res.status(200).json({
        success: true,
        leads,
        data: leads,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeadById(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');
      if (!lead) throw ApiError.notFound('Lead not found');

      return ApiResponse.success(res, { lead });
    } catch (error) {
      next(error);
    }
  }

  static async updateLead(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, notes, assignedTo } = req.body;
      const lead = await Lead.findById(req.params.id);
      if (!lead) throw ApiError.notFound('Lead not found');

      const oldStatus = lead.status;
      if (status) lead.status = status;
      if (notes !== undefined) lead.notes = notes;
      if (assignedTo !== undefined) lead.assignedTo = assignedTo;

      await lead.save();

      await AuditService.log({
        req,
        action: 'LEAD_UPDATED',
        module: 'LEADS',
        resourceId: lead._id.toString(),
        details: { oldStatus, newStatus: lead.status, notesUpdated: notes !== undefined },
      });

      return ApiResponse.success(res, { lead }, 'Lead updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteLead(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) throw ApiError.notFound('Lead not found');

      await lead.deleteOne();

      await AuditService.log({
        req,
        action: 'LEAD_DELETED',
        module: 'LEADS',
        resourceId: lead._id.toString(),
        details: { name: lead.name, email: lead.email },
      });

      return ApiResponse.success(res, null, 'Lead deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async exportLeadsCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const leads = await Lead.find().sort({ createdAt: -1 }).lean();

      const headers = ['ID', 'Name', 'Email', 'Phone', 'Business', 'Service', 'Status', 'Notes', 'Date'];
      const rows = (leads as any[]).map((l) => [
        l._id.toString(),
        `"${(l.name || '').replace(/"/g, '""')}"`,
        `"${(l.email || '').replace(/"/g, '""')}"`,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.businessName || '').replace(/"/g, '""')}"`,
        `"${(l.service || '').replace(/"/g, '""')}"`,
        l.status,
        `"${(l.notes || '').replace(/"/g, '""')}"`,
        l.createdAt.toISOString(),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      await AuditService.log({
        req,
        action: 'LEADS_EXPORTED_CSV',
        module: 'LEADS',
        details: { totalRows: leads.length },
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=leads-${Date.now()}.csv`);
      return res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
