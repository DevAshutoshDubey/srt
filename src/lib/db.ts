import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export const queries = {
  // Test connection - ADD THIS METHOD
  testConnection: async () => {
    try {
      const result = await sql`SELECT 1 as test`;
      return result[0];
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }
  },

  // Organizations
  createOrganization: async (data: {
    name: string;
    slug: string;
    email: string;
    apiKey: string;
  }) => {
    const result = await sql`
      INSERT INTO organizations (name, slug, email, api_key)
      VALUES (${data.name}, ${data.slug}, ${data.email}, ${data.apiKey})
      RETURNING *
    `;
    return result[0];
  },

  getOrganizationByApiKey: async (apiKey: string) => {
    const result = await sql`
      SELECT * FROM organizations 
      WHERE api_key = ${apiKey} AND subscription_status = 'active'
      LIMIT 1
    `;
    console.log(result[0]);
    return result[0] || null;
  },

  // Users
  createUser: async (data: {
    organizationId: number;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => {
    const result = await sql`
      INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
      VALUES (${data.organizationId}, ${data.email}, ${data.passwordHash}, ${data.firstName}, ${data.lastName}, ${data.role})
      RETURNING *
    `;
    return result[0];
  },

  getUserByEmail: async (email: string) => {
    const result = await sql`
      SELECT u.*, o.name as organization_name, o.slug as organization_slug
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = ${email}
      LIMIT 1
    `;
    return result[0] || null;
  },

  // URLs
  createUrl: async (data: {
    organizationId: number;
    originalUrl: string;
    shortCode: string;
    domainId?: number;
    createdBy?: number;
    expiresAt?: string;
  }) => {
    const result = await sql`
      INSERT INTO urls (organization_id, original_url, short_code, domain_id, created_by, expires_at)
      VALUES (${data.organizationId}, ${data.originalUrl}, ${data.shortCode}, ${data.domainId || null}, ${data.createdBy || null}, ${data.expiresAt || null})
      RETURNING *
    `;
    return result[0];
  },

  getUrlByShortCode: async (shortCode: string, organizationId?: number) => {
    const result = await sql`
      SELECT u.*, d.domain, o.name as organization_name
      FROM urls u
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.short_code = ${shortCode}
      ${organizationId ? sql`AND u.organization_id = ${organizationId}` : sql``}
      AND (u.expires_at IS NULL OR u.expires_at > NOW())
      LIMIT 1
    `;
    return result[0] || null;
  },

  incrementUrlUsage: async (organizationId: number) => {
    await sql`
      UPDATE organizations 
      SET monthly_urls_used = monthly_urls_used + 1 
      WHERE id = ${organizationId}
    `;
  },

  // Analytics Methods
  getUrlAnalytics: async (urlId: number, organizationId: number) => {
    const result = await sql`
      SELECT 
        u.id,
        u.short_code,
        u.original_url,
        u.click_count,
        u.created_at,
        COUNT(uc.id) as total_clicks,
        COUNT(DISTINCT uc.ip_address) as unique_clicks
      FROM urls u
      LEFT JOIN url_clicks uc ON u.id = uc.url_id
      WHERE u.id = ${urlId} 
      AND u.organization_id = ${organizationId}
      GROUP BY u.id
    `;
    return result[0] || null;
  },

  getClicksByDate: async (urlId: number, days = 30) => {
    const result = await sql`
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks
      FROM url_clicks 
      WHERE url_id = ${urlId}
      AND clicked_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(clicked_at)
      ORDER BY date ASC
    `;
    return result;
  },

  getTopCountries: async (urlId: number, limit = 10) => {
    const result = await sql`
      SELECT 
        COALESCE(country, 'Unknown') as country,
        COUNT(*) as clicks
      FROM url_clicks 
      WHERE url_id = ${urlId}
      AND country IS NOT NULL
      GROUP BY country
      ORDER BY clicks DESC
      LIMIT ${limit}
    `;
    return result;
  },

  getTopReferrers: async (urlId: number, limit = 10) => {
    const result = await sql`
      SELECT 
        CASE 
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
          ELSE referrer
        END as referrer,
        COUNT(*) as clicks
      FROM url_clicks 
      WHERE url_id = ${urlId}
      GROUP BY referrer
      ORDER BY clicks DESC
      LIMIT ${limit}
    `;
    return result;
  },

  getOrganizationAnalytics: async (organizationId: number, days = 30) => {
    const result = await sql`
      SELECT 
        DATE(uc.clicked_at) as date,
        COUNT(uc.id) as total_clicks,
        COUNT(DISTINCT uc.url_id) as active_urls,
        COUNT(DISTINCT uc.ip_address) as unique_visitors
      FROM url_clicks uc
      JOIN urls u ON uc.url_id = u.id
      WHERE u.organization_id = ${organizationId}
      AND uc.clicked_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(uc.clicked_at)
      ORDER BY date ASC
    `;
    return result;
  },

  logUrlClick: async (data: {
    urlId: number;
    organizationId: number;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    country?: string;
  }) => {
    const result = await sql`
      INSERT INTO url_clicks (url_id, organization_id, ip_address, user_agent, referrer, country, clicked_at)
      VALUES (${data.urlId}, ${data.organizationId}, ${data.ipAddress}, ${data.userAgent}, ${data.referrer}, ${data.country}, NOW())
      RETURNING *
    `;
    return result[0];
  },

  getDomainsByOrganization: async (organizationId: number) => {
    const result = await sql`
      SELECT * FROM domains 
      WHERE organization_id = ${organizationId}
      ORDER BY created_at DESC
    `;
    return result;
  },

  createDomain: async (data: { organizationId: number; domain: string }) => {
    const result = await sql`
      INSERT INTO domains (organization_id, domain, is_active)
      VALUES (${data.organizationId}, ${data.domain}, false)
      RETURNING *
    `;
    return result[0];
  },

  verifyDomain: async (domainId: number, organizationId: number) => {
    const result = await sql`
      UPDATE domains 
      SET is_active = true, verified_at = NOW()
      WHERE id = ${domainId} AND organization_id = ${organizationId}
      RETURNING *
    `;
    return result[0];
  },

   updateUserProfile: async (email: string, data: {
    firstName: string;
    lastName: string;
  }) => {
    const result = await sql`
      UPDATE users 
      SET 
        first_name = ${data.firstName},
        last_name = ${data.lastName}
      WHERE email = ${email}
      RETURNING id, email, first_name, last_name, role, created_at
    `;
    return result[0];
  },

  // Get user with organization details
  getUserWithOrganization: async (userId: number) => {
    const result = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at as user_created_at,
        o.id as org_id,
        o.name as org_name,
        o.slug as org_slug,
        o.api_key,
        o.subscription_tier,
        o.subscription_status,
        o.monthly_urls_used,
        o.monthly_url_limit,
        o.created_at as org_created_at
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ${userId}
      LIMIT 1
    `;
    return result[0] || null;
  },

   getOrganizationById: async (id: number) => {
    const result = await sql`
      SELECT * FROM organizations WHERE id = ${id} LIMIT 1
    `;
    return result[0] || null;
  },
   getUrlsByOrganization: async (organizationId: number, limit = 10) => {
    const result = await sql`
      SELECT u.*, d.domain
      FROM urls u
      LEFT JOIN domains d ON u.domain_id = d.id
      WHERE u.organization_id = ${organizationId}
      ORDER BY u.created_at DESC
      LIMIT ${limit}
    `;
    return result;
  },
   // Admin Methods
  getAllUsers: async (limit = 50, offset = 0, search = '') => {
    let query = sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.admin_level,
        u.created_at,
        o.name as organization_name,
        o.subscription_tier,
        o.subscription_status,
        o.monthly_urls_used,
        o.monthly_url_limit,
        (SELECT COUNT(*) FROM urls WHERE organization_id = o.id) as total_urls,
        (SELECT COALESCE(SUM(click_count), 0) FROM urls WHERE organization_id = o.id) as total_clicks
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
    `;

    if (search) {
      query = sql`
        ${query}
        WHERE u.email ILIKE ${'%' + search + '%'} 
        OR u.first_name ILIKE ${'%' + search + '%'}
        OR u.last_name ILIKE ${'%' + search + '%'}
        OR o.name ILIKE ${'%' + search + '%'}
      `;
    }

    query = sql`
      ${query}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return await query;
  },

  getUsersCount: async (search = '') => {
    let query = sql`
      SELECT COUNT(*) as count
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
    `;

    if (search) {
      query = sql`
        ${query}
        WHERE u.email ILIKE ${'%' + search + '%'} 
        OR u.first_name ILIKE ${'%' + search + '%'}
        OR u.last_name ILIKE ${'%' + search + '%'}
        OR o.name ILIKE ${'%' + search + '%'}
      `;
    }

    const result = await query;
    return parseInt(result[0].count);
  },

  updateUserAdminLevel: async (userId: number, adminLevel: string) => {
    const result = await sql`
      UPDATE users 
      SET admin_level = ${adminLevel}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
    return result[0];
  },

  suspendUser: async (userId: number) => {
    await sql`
      UPDATE users 
      SET admin_level = 'suspended', updated_at = NOW()
      WHERE id = ${userId}
    `;
    
    // Also suspend the organization
    await sql`
      UPDATE organizations 
      SET subscription_status = 'suspended', updated_at = NOW()
      WHERE id = (SELECT organization_id FROM users WHERE id = ${userId})
    `;
  },

  getSystemStats: async () => {
    const result = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM organizations) as total_organizations,
        (SELECT COUNT(*) FROM urls) as total_urls,
        (SELECT COALESCE(SUM(click_count), 0) FROM urls) as total_clicks,
        (SELECT COUNT(*) FROM domains WHERE is_active = true) as active_domains,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month,
        (SELECT COUNT(*) FROM urls WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours') as urls_created_today
    `;
    return result[0];
  },

  getAdminSettings: async () => {
    const result = await sql`
      SELECT setting_key, setting_value, description 
      FROM admin_settings 
      ORDER BY setting_key
    `;
    return result;
  },

  updateAdminSetting: async (key: string, value: string) => {
    const result = await sql`
      UPDATE admin_settings 
      SET setting_value = ${value}, updated_at = NOW()
      WHERE setting_key = ${key}
      RETURNING *
    `;
    return result[0];
  },

  logAdminAction: async (data: {
    adminUserId: number;
    action: string;
    targetType?: string;
    targetId?: number;
    details?: any;
    ipAddress?: string;
  }) => {
    const result = await sql`
      INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
      VALUES (${data.adminUserId}, ${data.action}, ${data.targetType || null}, ${data.targetId || null}, ${JSON.stringify(data.details) || null}, ${data.ipAddress || null})
      RETURNING *
    `;
    return result[0];
  },

  getAdminLogs: async (limit = 100, offset = 0) => {
    const result = await sql`
      SELECT 
        al.*,
        u.email as admin_email,
        u.first_name || ' ' || u.last_name as admin_name
      FROM admin_logs al
      JOIN users u ON al.admin_user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result;
  },
};
