const express = require('express');
const router = express.Router();
const slotController = require('../features/appointments/controllers/slotController');
const appointmentController = require('../features/appointments/controllers/appointmentController');
const { identifyTenant } = require('../core/tenant/middlewares/tenant.middleware');
const logger = require('../shared/logger');

// Middleware para identificar tenant (sin autenticación)
router.use(identifyTenant);

/**
 * @swagger
 * tags:
 *   name: Public Appointments
 *   description: Endpoints públicos para citas (sin autenticación)
 */

/**
 * @swagger
 * /api/public/appointments/slots/available:
 *   get:
 *     summary: Obtener slots disponibles para agendar citas
 *     tags: [Public Appointments]
 *     parameters:
 *       - in: query
 *         name: professionalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del profesional
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-08-15"
 *         description: Fecha para buscar slots disponibles
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: ID del servicio (opcional)
 *       - in: header
 *         name: X-Tenant-Name
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del tenant
 *       - in: header
 *         name: X-Tenant-Slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Slug del tenant
 *     responses:
 *       200:
 *         description: Lista de slots disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           start:
 *                             type: string
 *                             format: date-time
 *                           end:
 *                             type: string
 *                             format: date-time
 *                           isAvailable:
 *                             type: boolean
 *                     professional:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *       404:
 *         description: Profesional no encontrado
 */
router.get('/slots/available', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado',
        message: 'No se pudo identificar el tenant. Proporcione X-Tenant-Name o X-Tenant-Slug en el header.'
      });
    }

    const { professionalId, date, serviceId } = req.query;

    if (!professionalId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros requeridos',
        message: 'professionalId y date son requeridos'
      });
    }

    // Verificar que el profesional pertenece al tenant
    const professional = await appointmentController.getProfessionalById(professionalId, req.tenant._id);
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: 'Profesional no encontrado',
        message: 'El profesional solicitado no existe o no pertenece a este negocio'
      });
    }

    // Obtener slots disponibles
    const slots = await slotController.getPublicAvailableSlots(professionalId, date, serviceId, req.tenant._id);

    res.set('Cache-Control', 'public, max-age=60'); // Cache 1 minuto
    res.json({
      success: true,
      data: {
        slots: slots.map(slot => ({
          id: slot._id,
          start: slot.start,
          end: slot.end,
          isAvailable: slot.isAvailable,
          duration: slot.duration
        })),
        professional: {
          id: professional._id,
          name: professional.name,
          specialty: professional.specialty
        },
        date: date,
        serviceId: serviceId || null
      }
    });

  } catch (error) {
    logger.error('Error obteniendo slots disponibles:', {
      error: error.message,
      professionalId: req.query.professionalId,
      date: req.query.date,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/appointments/professionals:
 *   get:
 *     summary: Obtener lista de profesionales disponibles para citas
 *     tags: [Public Appointments]
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Name
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del tenant
 *       - in: header
 *         name: X-Tenant-Slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Slug del tenant
 *       - in: query
 *         name: serviceId
 *         schema:
 *           type: string
 *         description: Filtrar por servicio específico
 *     responses:
 *       200:
 *         description: Lista de profesionales
 */
router.get('/professionals', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    const { serviceId } = req.query;
    const professionals = await appointmentController.getPublicProfessionals(req.tenant._id, serviceId);

    res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutos
    res.json({
      success: true,
      data: {
        professionals: professionals.map(prof => ({
          id: prof._id,
          name: prof.name,
          specialty: prof.specialty,
          bio: prof.bio,
          profileImage: prof.profileImage,
          availability: prof.availability,
          services: prof.services || []
        }))
      }
    });

  } catch (error) {
    logger.error('Error obteniendo profesionales públicos:', {
      error: error.message,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/appointments:
 *   post:
 *     summary: Crear una nueva cita (público)
 *     tags: [Public Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotId
 *               - clientName
 *               - clientEmail
 *               - clientPhone
 *             properties:
 *               slotId:
 *                 type: string
 *                 description: ID del slot de cita
 *               clientName:
 *                 type: string
 *                 description: Nombre del cliente
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 description: Email del cliente
 *               clientPhone:
 *                 type: string
 *                 description: Teléfono del cliente
 *               notes:
 *                 type: string
 *                 description: Notas opcionales
 *               serviceId:
 *                 type: string
 *                 description: ID del servicio (opcional)
 *     responses:
 *       201:
 *         description: Cita creada exitosamente
 *       400:
 *         description: Datos inválidos o slot no disponible
 */
router.post('/', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    const { slotId, clientName, clientEmail, clientPhone, notes, serviceId } = req.body;

    // Validar datos requeridos
    if (!slotId || !clientName || !clientEmail || !clientPhone) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos',
        message: 'slotId, clientName, clientEmail y clientPhone son requeridos'
      });
    }

    // Crear la cita
    const appointment = await appointmentController.createPublicAppointment({
      slotId,
      clientName,
      clientEmail,
      clientPhone,
      notes,
      serviceId,
      tenantId: req.tenant._id
    });

    res.status(201).json({
      success: true,
      data: {
        id: appointment._id,
        slotId: appointment.slotId,
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        clientPhone: appointment.clientPhone,
        status: appointment.status,
        start: appointment.start,
        end: appointment.end,
        notes: appointment.notes,
        serviceId: appointment.serviceId,
        confirmationCode: appointment.confirmationCode
      },
      message: 'Cita creada exitosamente. Te hemos enviado un email de confirmación.'
    });

  } catch (error) {
    logger.error('Error creando cita pública:', {
      error: error.message,
      slotId: req.body.slotId,
      tenantId: req.tenant?._id
    });
    
    if (error.message.includes('no disponible') || error.message.includes('ocupado')) {
      return res.status(400).json({
        success: false,
        error: 'Slot no disponible',
        message: 'El horario seleccionado ya no está disponible. Por favor, selecciona otro horario.'
      });
    }
    
    next(error);
  }
});

/**
 * @swagger
 * /api/public/appointments/{confirmationCode}:
 *   get:
 *     summary: Obtener información de una cita por código de confirmación
 *     tags: [Public Appointments]
 *     parameters:
 *       - in: path
 *         name: confirmationCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de confirmación de la cita
 *     responses:
 *       200:
 *         description: Información de la cita
 *       404:
 *         description: Cita no encontrada
 */
router.get('/:confirmationCode', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    const { confirmationCode } = req.params;
    const appointment = await appointmentController.getPublicAppointmentByCode(confirmationCode, req.tenant._id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada',
        message: 'No se encontró una cita con ese código de confirmación'
      });
    }

    res.json({
      success: true,
      data: {
        id: appointment._id,
        confirmationCode: appointment.confirmationCode,
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        clientPhone: appointment.clientPhone,
        status: appointment.status,
        start: appointment.start,
        end: appointment.end,
        notes: appointment.notes,
        service: appointment.service ? {
          id: appointment.service._id,
          name: appointment.service.name,
          duration: appointment.service.duration,
          price: appointment.service.price
        } : null,
        professional: appointment.professional ? {
          id: appointment.professional._id,
          name: appointment.professional.name,
          specialty: appointment.professional.specialty
        } : null,
        createdAt: appointment.createdAt
      }
    });

  } catch (error) {
    logger.error('Error obteniendo cita pública:', {
      error: error.message,
      confirmationCode: req.params.confirmationCode,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/appointments/{confirmationCode}/cancel:
 *   patch:
 *     summary: Cancelar una cita por código de confirmación
 *     tags: [Public Appointments]
 *     parameters:
 *       - in: path
 *         name: confirmationCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de confirmación de la cita
 *     responses:
 *       200:
 *         description: Cita cancelada exitosamente
 *       404:
 *         description: Cita no encontrada
 */
router.patch('/:confirmationCode/cancel', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    const { confirmationCode } = req.params;
    const appointment = await appointmentController.cancelPublicAppointment(confirmationCode, req.tenant._id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada',
        message: 'No se encontró una cita con ese código de confirmación'
      });
    }

    res.json({
      success: true,
      data: {
        id: appointment._id,
        confirmationCode: appointment.confirmationCode,
        status: appointment.status,
        cancelledAt: appointment.updatedAt
      },
      message: 'Cita cancelada exitosamente'
    });

  } catch (error) {
    logger.error('Error cancelando cita pública:', {
      error: error.message,
      confirmationCode: req.params.confirmationCode,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

module.exports = router;
