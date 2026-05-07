const TenantService = require('../services/tenant.service');
const ProfileService = require('../../profiles/services/profile.service');
const ServiceController = require('../../../features/services/controllers/ServiceController');
const ProductService = require('../../../features/products/services/productService');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

const TenantController = {
  // Crear nuevo tenant (solo superadmin)
  async create(req, res, next) {
    try {
      const tenantData = {
        ...req.body,
        createdBy: req.user._id
      };

      const tenant = await TenantService.create(tenantData);
      logger.info('Tenant creado', { tenantId: tenant._id });

      res.status(201).json({
        id: tenant._id,
        subdomain: tenant.subdomain,
        fullDomain: tenant.fullDomain,
        createdAt: tenant.createdAt
      });
    } catch (error) {
      logger.error('Error al crear tenant', {
        error: error.message,
        user: req.user._id
      });
      next(error);
    }
  },

  // Obtener tenant actual (para rutas administrativas)
  async getCurrentTenant(req, res, next) {
    try {
      // Obtener el tenant del usuario autenticado
      let tenant = req.tenant;
      
      // Si no hay tenant desde el middleware, obtenerlo del usuario
      if (!tenant && req.user && req.user.tenantId) {
        tenant = await TenantService.findById(req.user.tenantId);
      }
      
      if (!tenant) {
        throw createError(404, 'Tenant no encontrado');
      }
      
      res.json({
        status: 'success',
        data: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          publicProfile: tenant.publicProfile,
          theme: tenant.theme,
          features: tenant.features,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener perfil público (para rutas públicas)
  async getPublicTenantProfile(req, res, next) {
    try {
      let tenant = req.tenant;
  
      // Resolver tenant sin autenticación
      if (!tenant) {
        const tenantId = req.headers['x-tenant-id'];
        const tenantName = req.headers['x-tenant-name'];
        let tenantSlug = req.headers['x-tenant-slug'] || req.params.slug;
  
        if (tenantSlug) {
          tenantSlug = String(tenantSlug).toLowerCase();
          tenant = await TenantService.findBySlug(tenantSlug);
        } else if (tenantId) {
          tenant = await TenantService.findById(tenantId);
        } else if (tenantName) {
          tenant = await TenantService.findByName(tenantName);
        }
  
        if (!tenant) {
          const tenants = await TenantService.findAll();
          tenant = tenants.find(t => t.isActive);
        }
      }
  
      if (!tenant) {
        throw createError(404, 'Tenant no encontrado');
      }
  
      if (!tenant.isActive) {
        throw createError(403, 'Tenant inactivo');
      }
  
      // Cargar profile público
      let profile = null;
      try {
        profile = await ProfileService.getProfile(tenant._id);
        logger.info('Profile data loaded for public tenant', {
          tenantId: tenant._id,
          profileFound: !!profile
        });
      } catch (error) {
        logger.warn('Error loading profile data for public tenant', {
          tenantId: tenant._id,
          error: error.message
        });
      }
  
      // Normalizadores
      const normalizeContact = (c = {}) => ({
        email: c.email || '',
        phone: c.phone || '',
        website: c.website || '',
        emails: Array.isArray(c.emails) ? c.emails : [],
        phones: Array.isArray(c.phones) ? c.phones : []
      });
  
      const normalizeProfileSections = (ps = {}) => ({
        show_appointments: ps.show_appointments !== false,
        show_stats: ps.show_stats !== false,
        show_testimonials: ps.show_testimonials !== false,
        show_contact: ps.show_contact !== false,
        show_location: ps.show_location !== false,
        show_social: ps.show_social !== false,
        show_products: ps.show_products !== false,
        show_services: ps.show_services !== false
      });
  
      // Resolver theme combinado (profile + tenant), exponiendo { colors, layout }
      const resolveTheme = () => {
        const pTheme = profile?.theme || {};
        const tTheme = tenant.theme || {};
        const primary = pTheme.primary_color || tTheme.primaryColor || '#4f46e5';
        const secondary = pTheme.secondary_color || tTheme.secondaryColor || '#7c3aed';
        const accent = pTheme.accent_color || '#a855f7';
  
        return {
          id: pTheme.template_id || 'default',
          name: 'Public Theme',
          colors: { primary, secondary, accent },
          layout: {
            header: 'gradient-art',
            stats: 'gradient',
            services: 'cards',
            testimonials: 'modern'
          }
        };
      };
  
      // Base de la respuesta
      const publicProfileData = {
        tenant: {
          id: tenant._id?.toString?.() || tenant.id || undefined,
          _id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          displayName: profile?.public_name || tenant.displayName || tenant.name,
          businessType: tenant.businessType,
          description: profile?.bio || profile?.description || tenant.description,
          logoUrl: profile?.logoUrl || tenant.publicProfile?.logoUrl,
          isActive: tenant.isActive,
          theme: tenant.theme || {
            primaryColor: '#4f46e5',
            secondaryColor: '#f43f5e',
            darkMode: false
          },
          features: tenant.features || {
            appointments: false,
            crm: false,
            ecommerce: false,
            inventory: false,
            orders: false,
            products: false,
            professionals: false,
            services: false,
            customDomain: false
          },
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt
        },
        profile: profile
          ? {
              _id: profile._id,
              tenant_id: profile.tenant_id,
              public_name: profile.public_name,
              title: profile.title,
              specialty: profile.specialty,
              bio: profile.bio,
              profileImage: profile.profileImage,
              profile_image: profile.profile_image,
              contact: normalizeContact(profile.contact || {}),
              location: profile.location || undefined,
              social_links: Array.isArray(profile.social_links) ? profile.social_links : [],
              stats: Array.isArray(profile.stats) ? profile.stats : [],
              testimonials: Array.isArray(profile.testimonials) ? profile.testimonials : [],
              theme: profile.theme || {},
              profile_sections: normalizeProfileSections(profile.profile_sections || {}),
              custom_fields: profile.custom_fields || {},
              createdAt: profile.createdAt,
              updatedAt: profile.updatedAt
            }
          : null,
        services: [],
        products: [],
        testimonials: Array.isArray(profile?.testimonials) ? profile.testimonials : [],
        stats: Array.isArray(profile?.stats) ? profile.stats : [],
        theme: resolveTheme(),
        professionals: [],
        gallery: []
      };
  
      // Servicios públicos (sin auth)
      try {
        const filters = { tenantId: tenant._id, isActive: true };
        const svc = await ServiceController.getPublicServices(filters);
        publicProfileData.services = (svc || []).map(s => ({
          id: s._id?.toString?.() || s.id,
          name: s.name,
          description: s.description,
          // Normalizar tipos
          price: typeof s.price === 'number' ? s.price : s.price ? Number(s.price) : undefined,
          duration: typeof s.duration === 'number' ? s.duration : s.duration ? Number(s.duration) : undefined
        }));
      } catch (e) {
        logger.warn('Error fetching public services', { tenantId: tenant._id, error: e.message });
      }
  
      // Productos públicos (sin auth)
      try {
        const productSvc = new ProductService(tenant._id.toString());
        const prods = await productSvc.getAllProducts({ isActive: true }, { limit: 50 });
        publicProfileData.products = (prods || []).map(p => ({
          id: p._id?.toString?.() || p.id,
          name: p.name,
          description: p.description,
          price: typeof p.price === 'number' ? p.price : p.price ? Number(p.price) : undefined
        }));
      } catch (e) {
        logger.warn('Error fetching public products', { tenantId: tenant._id, error: e.message });
      }
  
      res.status(200).json({
        status: 'success',
        data: publicProfileData
      });
    } catch (error) {
      logger.error('Error al obtener perfil público del tenant', {
        error: error.message,
        path: req.path,
        host: req.hostname
      });
      next(error);
    }
  },

  // Actualizar tenant
  async update(req, res, next) {
    try {
      const allowedFields = [
        'name',
        'publicProfile',
        'features',
        'theme',
        'isActive'
      ];
      
      const updateData = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const tenantId = req.params.id;

      const updatedTenant = await TenantService.update(tenantId, updateData);
      logger.info('Tenant actualizado', { tenantId: updatedTenant._id });

      res.json({
        id: updatedTenant._id,
        name: updatedTenant.name,
        updatedAt: updatedTenant.updatedAt
      });
    } catch (error) {
      logger.error('Error al actualizar tenant', {
        tenantId: req.params.id,
        error: error.message
      });
      next(error);
    }
  },

  // Actualizar tema
  async updateTheme(req, res, next) {
    try {
      const tenantId = req.params.id;
      const updatedTenant = await TenantService.updateTheme(
        tenantId,
        req.body
      );
      
      res.json({
        theme: updatedTenant.theme,
        updatedAt: updatedTenant.updatedAt
      });
    } catch (error) {
      next(error);
    }
  },

  // Desactivar tenant (solo superadmin)
  async deactivate(req, res, next) {
    try {
      const tenant = await TenantService.update(req.params.id, { isActive: false });
      logger.warn('Tenant desactivado', { tenantId: tenant._id });
      
      res.json({
        id: tenant._id,
        isActive: tenant.isActive,
        deactivatedAt: tenant.updatedAt
      });
    } catch (error) {
      logger.error('Error al desactivar tenant', {
        tenantId: req.params.id,
        error: error.message
      });
      next(error);
    }
  },

  // Obtener todos los tenants (solo admin)
  async getAll(req, res, next) {
    try {
      const tenants = await TenantService.findAll();
      res.status(200).json({
        status: 'success',
        results: tenants.length,
        data: tenants
      });
    } catch (error) {
      logger.error('Error al obtener todos los tenants', {
        error: error.message,
        user: req.user?._id
      });
      next(error);
    }
  },

  // Obtener tenant por ID (solo admin)
  async getById(req, res, next) {
    try {
      console.log("req.params.id:", req.params.id);
      const tenantId = req.params.id;
      if (!tenantId) {
        throw createError(400, 'ID de tenant no proporcionado');
      }
      const tenant = await TenantService.findById(tenantId);
      res.status(200).json({
        status: 'success',
        data: tenant
      });
    } catch (error) {
      logger.error('Error al obtener tenant por ID', {
        tenantId: req.params.id,
        error: error.message
      });
      next(error);
    }
  },

  // Verificar disponibilidad de slug
  async checkSlugAvailability(req, res, next) {
    try {
      const { slug } = req.query;
      
      if (!slug) {
        throw createError(400, 'Parámetro slug requerido');
      }

      const result = await TenantService.checkSlugAvailability(slug);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Error al verificar disponibilidad de slug', {
        slug: req.query.slug,
        error: error.message
      });
      next(error);
    }
  },

  // Obtener lista pública de tenants
  async getPublicTenantsList(req, res, next) {
    try {
      const tenants = await TenantService.findAll();
      const publicTenants = tenants
        .filter(t => t.isActive)
        .map(tenant => ({
          slug: tenant.slug,
          name: tenant.name,
          displayName: tenant.publicProfile?.displayName || tenant.name,
          description: tenant.publicProfile?.description,
          logoUrl: tenant.publicProfile?.logoUrl,
          url: `https://smartopsve.com/${tenant.slug}`
        }));

      res.status(200).json({
        status: 'success',
        results: publicTenants.length,
        data: publicTenants
      });
    } catch (error) {
      logger.error('Error al obtener lista pública de tenants', {
        error: error.message
      });
      next(error);
    }
  },

  // Generar sitemap XML
  async generateSitemap(req, res, next) {
    try {
      const tenants = await TenantService.findAll();
      const activeTenants = tenants.filter(t => t.isActive);

      const urls = activeTenants.map(tenant => {
        const lastmod = tenant.updatedAt.toISOString().split('T')[0];
        return `
  <url>
    <loc>https://smartopsve.com/${tenant.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }).join('');

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://smartopsve.com</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.status(200).send(sitemap);
    } catch (error) {
      logger.error('Error al generar sitemap', {
        error: error.message
      });
      next(error);
    }
  }
};

module.exports = TenantController;