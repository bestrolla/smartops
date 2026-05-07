const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server'); // Ya no es necesario aquí
const Tenant = require('../../../core/tenant/models/tenant.model');
const User = require('../../../core/auth/users/models/user.model');
const Professional = require('../../../features/professionals/models/Professional.model');
const ProfessionalType = require('../../../features/professionals/models/ProfessionalType.model');
const Availability = require('../../../features/appointments/models/Availability.model');
const AppointmentSlot = require('../../../features/appointments/models/AppointmentSlot.model');
const Appointment = require('../../../features/appointments/models/Appointment.model');
const Reminder = require('../../../features/appointments/models/Reminder.model');

// Services
const availabilityService = require('../../../features/appointments/services/availabilityService');
const slotService = require('../../../features/appointments/services/slotService');
const appointmentService = require('../../../features/appointments/services/appointmentService');

let tenant;
let professionalUser;
let clientUser;
let professional;
let professionalType;

describe('Appointments Module - Model and Service Tests', () => {

  beforeEach(async () => {
    // Limpiar todas las colecciones relevantes
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }

    // Crear datos base para las pruebas
    tenant = await Tenant.create({ name: 'Test Tenant' });
    
    professionalType = await ProfessionalType.create({
      tenantId: tenant._id,
      name: 'General Doctor',
      description: 'Test Doctor Type',
    });

    professionalUser = await User.create({
      tenantId: tenant._id,
      username: 'professional_test_user',
      email: 'prof@test.com',
      firstName: 'Juan',
      lastName: 'Profesional',
      password: 'password123'
    });
    
    clientUser = await User.create({
      tenantId: tenant._id,
      username: 'client_test_user',
      email: 'client@test.com',
      firstName: 'Maria',
      lastName: 'Cliente',
      password: 'password123'
    });

    professional = await Professional.create({
      tenantId: tenant._id,
      userId: professionalUser._id,
      specialties: ['Cardiología'],
      professionalType: professionalType._id
    });
  });

  // --- Availability Tests ---
  describe('Availability Service', () => {
    it('should create or update availability for a professional', async () => {
      const availabilityData = {
        daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
        startTime: '09:00',
        endTime: '17:00',
        slotDuration: 30
      };
      
      const availability = await availabilityService.updateAvailability(professional._id, availabilityData);
      
      expect(availability).toBeDefined();
      expect(availability.professionalId).toEqual(professional._id);
      expect(availability.startTime).toBe('09:00');
    });

    it('should fail to create availability with invalid data', async () => {
      const invalidAvailabilityData = {
        daysOfWeek: [1, 2],
        startTime: '9am', // Formato inválido
        endTime: '5pm'
      };
      
      await expect(availabilityService.updateAvailability(professional._id, invalidAvailabilityData)).rejects.toThrow();
    });
  });
  
  // --- Slot Generation Tests ---
  describe('Slot Service', () => {
    it('should generate appointment slots based on availability', async () => {
      await availabilityService.updateAvailability(professional._id, {
        tenantId: tenant._id,
        daysOfWeek: [1], // Lunes
        startTime: '10:00',
        endTime: '12:00',
        slotDuration: 60
      });
      
      // Buscamos un Lunes para generar los slots
      const monday = '2024-08-05'; 
      const slots = await slotService.generateSlots(professional._id, monday, '2024-08-06');
      
      expect(slots.length).toBe(2); // 10:00, 11:00
      expect(slots[0].start).toEqual(new Date(`${monday}T10:00:00.000-04:00`)); // Asumiendo UTC-4
      expect(slots[0].end).toEqual(new Date(`${monday}T11:00:00.000-04:00`));
      
      const dbSlots = await AppointmentSlot.find({ professionalId: professional._id });
      expect(dbSlots.length).toBe(2);
    });
  });

  // --- Appointment Booking and Cancellation Tests ---
  describe('Appointment Service', () => {
    it('should book an appointment and mark the slot as unavailable', async () => {
      await availabilityService.updateAvailability(professional._id, {
        tenantId: tenant._id, daysOfWeek: [1], startTime: '10:00', endTime: '11:00', slotDuration: 60
      });
      await slotService.generateSlots(professional._id, '2024-08-05', '2024-08-06');
      const availableSlot = await AppointmentSlot.findOne({ professionalId: professional._id, isAvailable: true });
      
      const appointment = await appointmentService.createAppointment({
        slotId: availableSlot._id,
        userId: clientUser._id,
        createdBy: clientUser._id,
        notes: 'Test appointment'
      });
      
      expect(appointment).toBeDefined();
      expect(appointment.status).toBe('pending');
      
      const updatedSlot = await AppointmentSlot.findById(availableSlot._id);
      expect(updatedSlot.isAvailable).toBe(false);
    });
    
    it('should throw an error when booking an unavailable slot', async () => {
      const slot = await AppointmentSlot.create({
        professionalId: professional._id, tenantId: tenant._id, start: new Date(), end: new Date(), isAvailable: false
      });
      
      await expect(appointmentService.createAppointment({ slotId: slot._id, userId: clientUser._id })).rejects.toThrow('Este horario ya no está disponible.');
    });

    it('should cancel an appointment and free up the slot', async () => {
      // 1. Crear el slot y la cita
      const slot = await AppointmentSlot.create({
        professionalId: professional._id, tenantId: tenant._id, start: new Date(), end: new Date(), isAvailable: false
      });
      const appointment = await Appointment.create({
        tenantId: tenant._id, professionalId: professional._id, userId: clientUser._id, slotId: slot._id, start: slot.start, end: slot.end
      });

      // 2. Cancelar la cita
      await appointmentService.cancelAppointment(appointment._id);
      
      // 3. Verificar
      const cancelledAppointment = await Appointment.findById(appointment._id);
      expect(cancelledAppointment.status).toBe('cancelled');
      
      const freedSlot = await AppointmentSlot.findById(slot._id);
      expect(freedSlot.isAvailable).toBe(true);
    });
  });
  
  // --- Reminder Generation Tests ---
  describe('Reminder Service Integration', () => {
    it('should create reminders when an appointment is booked with reminder config', async () => {
      await availabilityService.updateAvailability(professional._id, {
        tenantId: tenant._id, daysOfWeek: [1], startTime: '15:00', endTime: '16:00', slotDuration: 60
      });
      await slotService.generateSlots(professional._id, '2024-08-05', '2024-08-06');
      const availableSlot = await AppointmentSlot.findOne({ professionalId: professional._id });

      // Cita con configuración de recordatorios
      const appointmentData = {
        slotId: availableSlot._id,
        userId: clientUser._id,
        reminders: [
          { method: 'email', timeBefore: 60 }, // 1 hora antes
          { method: 'sms', timeBefore: 10 }   // 10 mins antes
        ]
      };
      
      await appointmentService.createAppointment(appointmentData);
      
      // Esperar a que los recordatorios asíncronos se creen
      await new Promise(res => setTimeout(res, 150));
      
      const reminders = await Reminder.find({ userId: clientUser._id });
      expect(reminders.length).toBe(2);
      expect(reminders.some(r => r.method === 'email')).toBe(true);
      
      // Verificar que el timeToSend es correcto
      const emailReminder = reminders.find(r => r.method === 'email');
      const expectedTime = new Date(availableSlot.start.getTime() - 60 * 60 * 1000); // 1h antes
      expect(emailReminder.timeToSend.getTime()).toBe(expectedTime.getTime());
    });
  });

}); 