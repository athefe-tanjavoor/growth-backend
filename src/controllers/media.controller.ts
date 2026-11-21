import { Request, Response, NextFunction } from 'express';
import { Media } from '../models/Media.js';
import { 
  uploadBufferToR2, 
  generatePresignedUploadUrl, 
  deleteObjectFromR2 
} from '../services/r2.service.js';
import { AuditService } from '../services/audit.service.js';
import { ApiResponse, ApiError } from '../utils/response.js';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export class MediaController {
  // Legacy & direct buffer upload to Cloudflare R2
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file provided in request');
      }

      const extension = IMAGE_EXTENSIONS[req.file.mimetype] || 'bin';
      const folder = (req.body.folder as string) || 'uploads';

      const result = await uploadBufferToR2({
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        extension,
        folder,
        originalName: req.file.originalname,
      });

      // Save metadata in MongoDB
      const mediaDoc = await Media.create({
        name: req.file.originalname,
        size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
        rawSize: req.file.size,
        folder,
        type: req.file.mimetype.split('/')[0] || 'image',
        mime: req.file.mimetype,
        preview: result.url,
        key: result.key,
        bucket: result.bucket,
        storageType: 'r2',
      });

      await AuditService.log({
        req,
        action: 'MEDIA_UPLOADED_R2',
        module: 'MEDIA',
        resourceId: mediaDoc._id.toString(),
        details: { key: result.key, size: req.file.size },
      });

      // Support both legacy shapes ({ key, url } / { imageUrl })
      return res.status(201).json({
        success: true,
        key: result.key,
        url: result.url,
        imageUrl: result.url,
        data: mediaDoc,
      });
    } catch (error) {
      next(error);
    }
  }

  // Pre-signed direct browser upload URL (for large files without loading into memory)
  static async getPresignedUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { contentType, extension, folder = 'uploads' } = req.body;
      if (!contentType || !extension) {
        throw ApiError.badRequest('contentType and extension are required');
      }

      const presigned = await generatePresignedUploadUrl({
        contentType,
        extension,
        folder,
      });

      return ApiResponse.success(res, presigned, 'Presigned URL generated');
    } catch (error) {
      next(error);
    }
  }

  static async listMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { folder, type } = req.query;
      const query: any = {};
      if (folder && folder !== 'All') query.folder = folder;
      if (type && type !== 'All') query.type = type;

      const media = await Media.find(query).sort({ createdAt: -1 }).lean();
      return res.status(200).json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  }

  static async createMediaRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const media = await Media.create(req.body);
      return ApiResponse.created(res, media);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        throw ApiError.badRequest('Array of IDs required');
      }

      const items = await Media.find({ _id: { $in: ids } });
      for (const item of items) {
        if (item.key) {
          await deleteObjectFromR2(item.key);
        }
      }

      await Media.deleteMany({ _id: { $in: ids } });

      await AuditService.log({
        req,
        action: 'MEDIA_DELETED',
        module: 'MEDIA',
        details: { count: ids.length, ids },
      });

      return res.status(200).json({ success: true, message: 'Media items deleted' });
    } catch (error) {
      next(error);
    }
  }
}
