export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CONTENT_MANAGER = 'content_manager',
  MARKETING_MANAGER = 'marketing_manager',
  SALES_MANAGER = 'sales_manager',
  SALES_EXECUTIVE = 'sales_executive',
  VIEWER = 'viewer',
}

export enum Permission {
  // Leads
  LEADS_VIEW = 'leads.view',
  LEADS_CREATE = 'leads.create',
  LEADS_EDIT = 'leads.edit',
  LEADS_DELETE = 'leads.delete',
  LEADS_ASSIGN = 'leads.assign',
  LEADS_EXPORT = 'leads.export',

  // Blogs
  BLOGS_VIEW = 'blogs.view',
  BLOGS_CREATE = 'blogs.create',
  BLOGS_EDIT = 'blogs.edit',
  BLOGS_PUBLISH = 'blogs.publish',
  BLOGS_DELETE = 'blogs.delete',

  // Portfolio
  PORTFOLIOS_VIEW = 'portfolios.view',
  PORTFOLIOS_MANAGE = 'portfolios.manage',

  // Media
  MEDIA_VIEW = 'media.view',
  MEDIA_UPLOAD = 'media.upload',
  MEDIA_DELETE = 'media.delete',

  // User & RBAC Management
  USERS_MANAGE = 'users.manage',
  ROLES_MANAGE = 'roles.manage',

  // Audit & Security
  ACTIVITY_LOGS_VIEW = 'activity_logs.view',
  ACTIVITY_LOGS_EXPORT = 'activity_logs.export',
  SECURITY_MANAGE = 'security.manage',

  // Settings
  SETTINGS_MANAGE = 'settings.manage',
}

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_CREATE,
    Permission.LEADS_EDIT,
    Permission.LEADS_DELETE,
    Permission.LEADS_ASSIGN,
    Permission.LEADS_EXPORT,
    Permission.BLOGS_VIEW,
    Permission.BLOGS_CREATE,
    Permission.BLOGS_EDIT,
    Permission.BLOGS_PUBLISH,
    Permission.BLOGS_DELETE,
    Permission.PORTFOLIOS_VIEW,
    Permission.PORTFOLIOS_MANAGE,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_DELETE,
    Permission.USERS_MANAGE,
    Permission.ACTIVITY_LOGS_VIEW,
    Permission.SETTINGS_MANAGE,
  ],
  [Role.CONTENT_MANAGER]: [
    Permission.BLOGS_VIEW,
    Permission.BLOGS_CREATE,
    Permission.BLOGS_EDIT,
    Permission.BLOGS_PUBLISH,
    Permission.PORTFOLIOS_VIEW,
    Permission.PORTFOLIOS_MANAGE,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_DELETE,
  ],
  [Role.MARKETING_MANAGER]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_EXPORT,
    Permission.BLOGS_VIEW,
    Permission.BLOGS_CREATE,
    Permission.BLOGS_EDIT,
    Permission.BLOGS_PUBLISH,
    Permission.MEDIA_VIEW,
    Permission.MEDIA_UPLOAD,
  ],
  [Role.SALES_MANAGER]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_CREATE,
    Permission.LEADS_EDIT,
    Permission.LEADS_ASSIGN,
    Permission.LEADS_EXPORT,
  ],
  [Role.SALES_EXECUTIVE]: [
    Permission.LEADS_VIEW,
    Permission.LEADS_CREATE,
    Permission.LEADS_EDIT,
  ],
  [Role.VIEWER]: [
    Permission.LEADS_VIEW,
    Permission.BLOGS_VIEW,
    Permission.PORTFOLIOS_VIEW,
    Permission.MEDIA_VIEW,
  ],
};
