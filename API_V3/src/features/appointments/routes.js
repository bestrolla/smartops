const express = require('express');
const router = express.Router();

// Middlewares globales
const { authenticate } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');
router.use(authenticate);
router.use(identifyTenant);

// Controladores
const appointmentController = require('./controllers/appointmentController');
const slotController = require('./controllers/slotController');
const availabilityController = require('./controllers/availabilityController');
const googleCalendarController = require('./controllers/googleCalendarController');
// const reminderController = require('./controllers/reminderController'); // Aún no implementado

// Middlewares
const { authorize } = require('../../core/auth/middlewares/auth.middleware');
const validate = require('../../shared/middlewares/validator.middleware');
const { updateAvailabilitySchema } = require('./validations/availabilityValidations');
const { createAppointmentSchema } = require('./validations/appointmentValidations');
const { checkProfessionalOwnership, checkSlotAvailability } = require('./middlewares/appointmentMiddlewares');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: API para la gestión de citas y disponibilidad.
 *
 * /api/appointments:
 *   get:
 *     summary: Endpoint raíz del módulo de citas
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Availability:
 *       type: object
 *       properties:
 *         professionalId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [fixed, custom]
 *         daysOfWeek:
 *           type: array
 *           items:
 *             type: integer
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "18:00"
 *         slotDuration:
 *           type: integer
 *           example: 30
 *     AppointmentSlot:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         professionalId:
 *           type: string
 *         start:
 *           type: string
 *           format: date-time
 *         end:
 *           type: string
 *           format: date-time
 *         isAvailable:
 *           type: boolean
 *     Appointment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         professionalId:
 *           type: string
 *         userId:
 *           type: string
 *         start:
 *           type: string
 *           format: date-time
 *         end:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed, no_show]
 */

// --- Rutas de Integración con Google Calendar ---
/**
 * @swagger
 * /appointments/google/authorize:
 *   get:
 *     summary: Inicia la vinculación con Google Calendar
 *     tags: [Appointments, Integrations]
 *     responses:
 *       200:
 *         description: Devuelve la URL a la que el usuario debe ser redirigido para autorizar.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 */
router.get(
  '/google/authorize',
  authenticate,
  authorize(['manage:appointments']), // O un permiso específico para integraciones
  googleCalendarController.authorize
);

/**
 * @swagger
 * /appointments/google/oauth2callback:
 *   get:
 *     summary: Callback para el flujo OAuth2 de Google. No usar directamente.
 *     tags: [Appointments, Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Confirmación de la integración.
 */
router.get(
  '/google/oauth2callback',
  googleCalendarController.oauth2callback
);

// --- Rutas de Disponibilidad (Availability) ---
/**
 * @swagger
 * /appointments/availability/{professionalId}:
 *   get:
 *     summary: Obtiene la disponibilidad de un profesional
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: professionalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Disponibilidad del profesional
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Availability'
 */
router.get(
  '/availability/:professionalId',
  authenticate,
  authorize(['view:appointments']),
  checkProfessionalOwnership,
  availabilityController.get
);

/**
 * @swagger
 * /appointments/availability/{professionalId}:
 *   post:
 *     summary: Crea o actualiza la disponibilidad de un profesional
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: professionalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Availability'
 *     responses:
 *       200:
 *         description: Disponibilidad actualizada
 */
router.post(
  '/availability/:professionalId',
  authenticate,
  authorize(['manage:appointments']),
  checkProfessionalOwnership,
  validate(updateAvailabilitySchema),
  availabilityController.update
);

// --- Rutas de Slots (Turnos) ---
/**
 * @swagger
 * /appointments/slots/available:
 *   get:
 *     summary: Lista los slots (turnos) disponibles para un profesional en una fecha
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: professionalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-08-15"
 *     responses:
 *       200:
 *         description: Lista de slots disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AppointmentSlot'
 */
router.get(
  '/slots/available',
  // auth, // Podría ser pública o requerir autenticación
  slotController.listAvailable
);

/**
 * @swagger
 * /appointments/slots/generate:
 *   post:
 *     summary: Genera slots (turnos) para un profesional en un rango de fechas
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               professionalId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Slots generados exitosamente
 */
router.post(
  '/slots/generate',
  authenticate,
  authorize(['manage:appointments']),
  slotController.generate
);

// --- Rutas de Citas (Appointments) ---
/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Crear una nueva cita (con o sin servicio)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotId:
 *                 type: string
 *                 description: ID del slot de cita
 *               notes:
 *                 type: string
 *                 description: Notas opcionales
 *               reminders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     method:
 *                       type: string
 *                       enum: [email, sms, push]
 *                     timeBefore:
 *                       type: number
 *                       description: Minutos antes de la cita
 *               serviceId:
 *                 type: string
 *                 description: ID del servicio asociado (opcional)
 *     responses:
 *       201:
 *         description: Cita creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/',
  authenticate,
  identifyTenant,
  authorize(['create:appointments']),
  validate(createAppointmentSchema),
  require('./controllers/appointmentController').create
);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Lista las citas con filtros
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: professionalId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de citas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 */
router.get(
  '/appointments',
  authenticate,
  authorize(['view:appointments']),
  appointmentController.list
);

/**
 * @swagger
 * /appointments/{appointmentId}:
 *   patch:
 *     summary: Actualiza una cita
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed, no_show]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cita actualizada
 */
router.patch(
  '/appointments/:appointmentId',
  authenticate,
  authorize(['update:appointments']),
  appointmentController.update
);

/**
 * @swagger
 * /appointments/{appointmentId}/cancel:
 *   patch:
 *     summary: Cancela una cita
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cita cancelada
 */
router.patch(
  '/appointments/:appointmentId/cancel',
  authenticate,
  authorize(['cancel:appointments']),
  appointmentController.cancel
);

module.exports = router; 