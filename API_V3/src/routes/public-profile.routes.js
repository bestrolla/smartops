const express = require('express');
const router = express.Router();
const ProfileService = require('../core/profiles/services/profile.service');
const TenantService = require('../core/tenant/services/tenant.service');
const { requireTenant, requirePublicProfile } = require('../middleware/enhanced-tenant.middleware');
const logger = require('../shared/logger');
const ServiceCoreService = require('../features/services/services/ServiceCoreService');
const ProductService = require('../features/products/services/productService');

router.get('/:slug', requireTenant, requirePublicProfile, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tenant = await TenantService.findBySlug(slug);

    if (!tenant || !tenant.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado',
        message: `No existe un perfil con el identificador: ${slug}`
      });
    }

    const profile = await ProfileService.getProfile(tenant._id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no configurado',
        message: 'Este negocio aún no ha configurado su perfil público'
      });
    }

    const serviceCore = new ServiceCoreService(tenant._id.toString());
    const productService = new ProductService(tenant._id.toString());

    const [servicesRaw, productsRaw] = await Promise.all([
      serviceCore.getPublicServices({ isActive: true }),
      productService.getAllProducts({ isActive: true }, { limit: 100, sort: '-createdAt' })
    ]);

    const services = (servicesRaw || []).map(s => ({
      id: s._id,
      name: s.name,
      description: s.description,
      duration: s.duration,
      price: s.price,
      currency: s.currency,
      isPackage: s.isPackage,
      category: s.category ? { id: s.category._id, name: s.category.name } : (s.categoryId ? { id: s.categoryId } : null)
    }));

    const products = (productsRaw || []).map(p => ({
      id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency,
      category: p.category ? { id: p.category._id, name: p.category.name } : (p.categoryId ? { id: p.categoryId } : null)
    }));

    const publicProfile = {
      tenant: {
        id: tenant._id,
        slug: tenant.slug,
        name: tenant.publicProfile?.displayName || tenant.name,
        description: tenant.publicProfile?.description,
        businessType: tenant.businessType,
        theme: tenant.theme,
        features: tenant.features
      },
      profile: {
        public_name: profile.public_name,
        title: profile.title,
        specialty: profile.specialty,
        bio: profile.bio,
        profileImage: profile.profileImage || profile.profile_image,
        contact: profile.contact,
        social_links: profile.social_links,
        stats: profile.stats,
        testimonials: profile.testimonials,
        location: profile.location,
        profile_sections: profile.profile_sections,
        section_order: profile.section_order,
        theme: profile.theme,
        appointment_config: profile.appointment_config
      },
      services,
      products
    };

    res.set({
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Profile-Slug': slug,
      'X-Tenant-ID': tenant._id.toString()
    });

    res.json({
      success: true,
      data: publicProfile,
      meta: {
        slug,
        url: `https://smartopsve.com/${slug}`,
        apiUrl: `https://smartopsve.com/api/profile/${slug}`,
        lastModified: profile.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error en API de perfil:', {
      error: error.message,
      slug: req.params.slug
    });
    next(error);
  }
});

module.exports = router