const express = require('express');
const router = express.Router();
const { 
  getPublicTenantProfile,
  checkSlugAvailability,
  generateSitemap,
  getPublicTenantsList
} = require('./controllers/tenant.controller');

/**
 * @swagger
 * tags:
 *   name: Public Tenant
 *   description: Public tenant profile endpoints (no authentication required)
 */

/**
 * @swagger
 * /api/public/tenant/profile:
 *   get:
 *     summary: Get public profile information of the identified tenant
 *     tags: [Public Tenant]
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Name
 *         required: false
 *         schema:
 *           type: string
 *         description: Name of the tenant to retrieve profile for
 *       - in: header
 *         name: X-Tenant-Slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Slug of the tenant to retrieve profile for
 *     responses:
 *       200:
 *         description: Public tenant profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant:
 *                       $ref: '#/components/schemas/TenantPublic'
 *                     profile:
 *                       type: object
 *       400:
 *         description: Tenant not identified
 *       404:
 *         description: Tenant not found or inactive
 */
router.get('/tenant/profile', getPublicTenantProfile);

/**
 * @swagger
 * /api/public/tenant/check-slug:
 *   get:
 *     summary: Check if a slug is available for use
 *     tags: [Public Tenant]
 *     parameters:
 *       - in: query
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug to check availability for
 *     responses:
 *       200:
 *         description: Slug availability status
 */
router.get('/tenant/check-slug', checkSlugAvailability);

/**
 * @swagger
 * /api/public/tenant/{slug}:
 *   get:
 *     summary: Get public profile information by tenant slug
 *     tags: [Public Tenant]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug of the tenant
 *     responses:
 *       200:
 *         description: Public tenant profile data
 *       404:
 *         description: Tenant not found or inactive
 */
router.get('/tenant/:slug', getPublicTenantProfile);

/**
 * @swagger
 * /api/public/tenants:
 *   get:
 *     summary: Get list of all active public tenants
 *     tags: [Public Tenant]
 *     responses:
 *       200:
 *         description: List of active tenants
 */
router.get('/tenants', getPublicTenantsList);

/**
 * @swagger
 * /api/public/sitemap.xml:
 *   get:
 *     summary: Generate XML sitemap for all public tenants
 *     tags: [Public Tenant]
 *     responses:
 *       200:
 *         description: XML sitemap
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 */
router.get('/sitemap.xml', generateSitemap);

module.exports = router;