import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    twoFactorCode: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

export const leadCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Valid email is required').toLowerCase().trim(),
    phone: z.string().optional().default(''),
    businessName: z.string().optional().default(''),
    service: z.string().min(1, 'Service is required').trim(),
    message: z.string().min(1, 'Message is required').trim(),
  }),
});

export const leadUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['new', 'read', 'replied', 'converted', 'archived']).optional(),
    notes: z.string().optional(),
    assignedTo: z.string().optional().nullable(),
  }),
});

export const blogCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').trim(),
    slug: z.string().min(1, 'Slug is required').trim(),
    excerpt: z.string().min(1, 'Excerpt is required'),
    content: z.string().min(1, 'Content is required'),
    featuredImage: z.string().optional().default(''),
    category: z.string().optional().default('General'),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  }),
});

export const blogUpdateSchema = z.object({
  body: blogCreateSchema.shape.body.partial(),
});

export const portfolioCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').trim(),
    subtitle: z.string().optional().default(''),
    category: z.string().min(1, 'Category is required'),
    services: z.array(z.string()).optional().default([]),
    status: z.enum(['Published', 'Draft']).optional().default('Draft'),
    featured: z.boolean().optional().default(false),
    image: z.string().optional().default('/placeholder.jpg'),
    description: z.string().optional().default(''),
    link: z.string().optional().default(''),
  }),
});

export const portfolioUpdateSchema = z.object({
  body: portfolioCreateSchema.shape.body.partial(),
});

export const userCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    email: z.string().email('Valid email is required').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.string().min(1, 'Role is required'),
    customPermissions: z.array(z.string()).optional(),
  }),
});

export const userUpdateSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
    customPermissions: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    avatar: z.string().optional(),
  }),
});
