const mongoose = require('mongoose');
const Tenant = require('../../../core/tenant/models/tenant.model');
const User = require('../../../core/auth/users/models/user.model');
const Customer = require('../../../features/crm/models/Customer');
const Opportunity = require('../../../features/crm/models/Opportunity');
const Activity = require('../../../features/crm/models/Activity');
const Note = require('../../../features/crm/models/Note');
const Pipeline = require('../../../features/crm/models/Pipeline');
const Tag = require('../../../features/crm/models/Tag');
const Attachment = require('../../../features/crm/models/Attachment');

describe('CRM Module Model Tests', () => {
  let testTenant, testUser;

  beforeEach(async () => {
    testTenant = new Tenant({
      name: 'Test Tenant CRM',
      isActive: true,
      publicProfile: { displayName: 'Test Tenant CRM', description: 'CRM tenant', contactEmail: 'crm@example.com' }
    });
    await testTenant.save();

    testUser = new User({
      username: 'testcrm',
      email: 'testcrm@example.com',
      password: 'Test1234!',
      firstName: 'Test',
      lastName: 'CRM',
      status: 'active',
      isActive: true,
      tenantId: testTenant._id
    });
    await testUser.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Customer.deleteMany({});
    await Opportunity.deleteMany({});
    await Activity.deleteMany({});
    await Note.deleteMany({});
    await Pipeline.deleteMany({});
    await Tag.deleteMany({});
    await Attachment.deleteMany({});
  });

  describe('Customer Model', () => {
    it('should create a customer', async () => {
      const customer = new Customer({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'cliente.testcrm@example.com',
        assignedTo: testUser._id
      });
      await customer.save();
      expect(customer._id).toBeDefined();
      expect(customer.firstName).toBe('Cliente');
      expect(customer.email).toBe('cliente.testcrm@example.com');
    });
    it('should update a customer', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'cliente.testcrm@example.com'
      });
      customer.phone = '123456789';
      await customer.save();
      const updated = await Customer.findById(customer._id);
      expect(updated.phone).toBe('123456789');
    });
    it('should delete a customer', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'cliente.testcrm@example.com'
      });
      await Customer.findByIdAndDelete(customer._id);
      const deleted = await Customer.findById(customer._id);
      expect(deleted).toBeNull();
    });
    it('should require tenantId, firstName, lastName, email', async () => {
      const customer = new Customer({});
      let err;
      try { await customer.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.firstName).toBeDefined();
      expect(err.errors.lastName).toBeDefined();
      expect(err.errors.email).toBeDefined();
    });
    it('should not allow duplicate email for same tenant', async () => {
      await Customer.create({
        tenantId: testTenant._id,
        firstName: 'A', lastName: 'B', email: 'dup@crm.com'
      });
      let err;
      try {
        await Customer.create({
          tenantId: testTenant._id,
          firstName: 'C', lastName: 'D', email: 'dup@crm.com'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should set default status to lead', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'A', lastName: 'B', email: 'lead@crm.com'
      });
      expect(customer.status).toBe('lead');
    });
    it('should only allow valid status values', async () => {
      let err;
      try {
        await Customer.create({
          tenantId: testTenant._id,
          firstName: 'A', lastName: 'B', email: 'enum@crm.com', status: 'invalid'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
  });

  describe('Opportunity Model', () => {
    it('should create an opportunity', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'cliente2.testcrm@example.com'
      });
      const opportunity = new Opportunity({
        tenantId: testTenant._id,
        customerId: customer._id,
        name: 'Oportunidad Test',
        value: 1000
      });
      await opportunity.save();
      expect(opportunity._id).toBeDefined();
      expect(opportunity.name).toBe('Oportunidad Test');
    });
    it('should update an opportunity', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'cliente2.testcrm@example.com'
      });
      const opportunity = await Opportunity.create({
        tenantId: testTenant._id,
        customerId: customer._id,
        name: 'Oportunidad Test',
        value: 1000
      });
      opportunity.value = 2000;
      await opportunity.save();
      const updated = await Opportunity.findById(opportunity._id);
      expect(updated.value).toBe(2000);
    });
    it('should delete an opportunity', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'cliente2.testcrm@example.com'
      });
      const opportunity = await Opportunity.create({
        tenantId: testTenant._id,
        customerId: customer._id,
        name: 'Oportunidad Test',
        value: 1000
      });
      await Opportunity.findByIdAndDelete(opportunity._id);
      const deleted = await Opportunity.findById(opportunity._id);
      expect(deleted).toBeNull();
    });
    it('should require tenantId, customerId, name, value', async () => {
      const opp = new Opportunity({});
      let err;
      try { await opp.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.customerId).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.value).toBeDefined();
    });
    it('should set default stage/status/currency/probability', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id, firstName: 'A', lastName: 'B', email: 'oppdef@crm.com'
      });
      const opp = await Opportunity.create({
        tenantId: testTenant._id, customerId: customer._id, name: 'O', value: 1
      });
      expect(opp.stage).toBe('new');
      expect(opp.status).toBe('open');
      expect(opp.currency).toBe('USD');
      expect(opp.probability).toBe(0);
    });
    it('should only allow valid stage/status values', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id, firstName: 'A', lastName: 'B', email: 'oppval@crm.com'
      });
      let err;
      try {
        await Opportunity.create({
          tenantId: testTenant._id, customerId: customer._id, name: 'O', value: 1, stage: 'invalid'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should not allow probability < 0 or > 100', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id, firstName: 'A', lastName: 'B', email: 'oppprob@crm.com'
      });
      let err;
      try {
        await Opportunity.create({
          tenantId: testTenant._id, customerId: customer._id, name: 'O', value: 1, probability: -1
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
      err = undefined;
      try {
        await Opportunity.create({
          tenantId: testTenant._id, customerId: customer._id, name: 'O', value: 1, probability: 101
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
  });

  describe('Activity Model', () => {
    it('should create an activity', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clientea.testcrm@example.com'
      });
      const opportunity = await Opportunity.create({
        tenantId: testTenant._id,
        customerId: customer._id,
        name: 'OportunidadA',
        value: 500
      });
      const activity = new Activity({
        tenantId: testTenant._id,
        type: 'call',
        title: 'Llamada Test',
        relatedTo: { customerId: customer._id, opportunityId: opportunity._id },
        assignedTo: testUser._id
      });
      await activity.save();
      expect(activity._id).toBeDefined();
      expect(activity.type).toBe('call');
    });
    it('should update an activity', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clientea.testcrm@example.com'
      });
      const opportunity = await Opportunity.create({
        tenantId: testTenant._id,
        customerId: customer._id,
        name: 'OportunidadA',
        value: 500
      });
      const activity = await Activity.create({
        tenantId: testTenant._id,
        type: 'call',
        title: 'Llamada Test',
        relatedTo: { customerId: customer._id, opportunityId: opportunity._id },
        assignedTo: testUser._id
      });
      activity.status = 'completed';
      await activity.save();
      const updated = await Activity.findById(activity._id);
      expect(updated.status).toBe('completed');
    });
    it('should delete an activity', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clientea.testcrm@example.com'
      });
      const opportunity = await Opportunity.create({
        tenantId: testTenant._id,
        customerId: customer._id,
        name: 'OportunidadA',
        value: 500
      });
      const activity = await Activity.create({
        tenantId: testTenant._id,
        type: 'call',
        title: 'Llamada Test',
        relatedTo: { customerId: customer._id, opportunityId: opportunity._id },
        assignedTo: testUser._id
      });
      await Activity.findByIdAndDelete(activity._id);
      const deleted = await Activity.findById(activity._id);
      expect(deleted).toBeNull();
    });
    it('should require tenantId, type, title', async () => {
      const activity = new Activity({});
      let err;
      try { await activity.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.type).toBeDefined();
      expect(err.errors.title).toBeDefined();
    });
    it('should set default status and priority', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id, firstName: 'A', lastName: 'B', email: 'act@crm.com'
      });
      const opportunity = await Opportunity.create({
        tenantId: testTenant._id, customerId: customer._id, name: 'O', value: 1
      });
      const activity = await Activity.create({
        tenantId: testTenant._id, type: 'call', title: 'T', relatedTo: { customerId: customer._id, opportunityId: opportunity._id }
      });
      expect(activity.status).toBe('pending');
      expect(activity.priority).toBe('medium');
    });
    it('should only allow valid type/status/priority', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id, firstName: 'A', lastName: 'B', email: 'actval@crm.com'
      });
      const opportunity = await Opportunity.create({
        tenantId: testTenant._id, customerId: customer._id, name: 'O', value: 1
      });
      let err;
      try {
        await Activity.create({
          tenantId: testTenant._id, type: 'invalid', title: 'T', relatedTo: { customerId: customer._id, opportunityId: opportunity._id }
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
  });

  describe('Note Model', () => {
    it('should create a note', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clienten.testcrm@example.com'
      });
      const note = new Note({
        tenantId: testTenant._id,
        text: 'Nota de prueba',
        relatedTo: { customerId: customer._id },
        userId: testUser._id
      });
      await note.save();
      expect(note._id).toBeDefined();
      expect(note.text).toBe('Nota de prueba');
    });
    it('should update a note', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clienten.testcrm@example.com'
      });
      const note = await Note.create({
        tenantId: testTenant._id,
        text: 'Nota de prueba',
        relatedTo: { customerId: customer._id },
        userId: testUser._id
      });
      note.text = 'Nota actualizada';
      await note.save();
      const updated = await Note.findById(note._id);
      expect(updated.text).toBe('Nota actualizada');
    });
    it('should delete a note', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clienten.testcrm@example.com'
      });
      const note = await Note.create({
        tenantId: testTenant._id,
        text: 'Nota de prueba',
        relatedTo: { customerId: customer._id },
        userId: testUser._id
      });
      await Note.findByIdAndDelete(note._id);
      const deleted = await Note.findById(note._id);
      expect(deleted).toBeNull();
    });
    it('should require tenantId, text, userId', async () => {
      const note = new Note({});
      let err;
      try { await note.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.text).toBeDefined();
      expect(err.errors.userId).toBeDefined();
    });
  });

  describe('Pipeline Model', () => {
    it('should create a pipeline', async () => {
      const pipeline = new Pipeline({
        tenantId: testTenant._id,
        name: 'Pipeline Test',
        stages: [ { name: 'Etapa 1', order: 1 }, { name: 'Etapa 2', order: 2 } ]
      });
      await pipeline.save();
      expect(pipeline._id).toBeDefined();
      expect(pipeline.name).toBe('Pipeline Test');
      expect(pipeline.stages).toHaveLength(2);
    });
    it('should update a pipeline', async () => {
      const pipeline = await Pipeline.create({
        tenantId: testTenant._id,
        name: 'Pipeline Test',
        stages: [ { name: 'Etapa 1', order: 1 } ]
      });
      pipeline.name = 'Pipeline Actualizado';
      await pipeline.save();
      const updated = await Pipeline.findById(pipeline._id);
      expect(updated.name).toBe('Pipeline Actualizado');
    });
    it('should delete a pipeline', async () => {
      const pipeline = await Pipeline.create({
        tenantId: testTenant._id,
        name: 'Pipeline Test',
        stages: [ { name: 'Etapa 1', order: 1 } ]
      });
      await Pipeline.findByIdAndDelete(pipeline._id);
      const deleted = await Pipeline.findById(pipeline._id);
      expect(deleted).toBeNull();
    });
    it('should require tenantId, name', async () => {
      const pipeline = new Pipeline({});
      let err;
      try { await pipeline.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.name).toBeDefined();
    });
    it('should set default isDefault to false', async () => {
      const pipeline = await Pipeline.create({
        tenantId: testTenant._id, name: 'P', stages: [{ name: 'S', order: 1 }]
      });
      expect(pipeline.isDefault).toBe(false);
    });
  });

  describe('Tag Model', () => {
    it('should create a tag', async () => {
      const tag = new Tag({
        tenantId: testTenant._id,
        name: 'Tag Test',
        color: '#ff0000'
      });
      await tag.save();
      expect(tag._id).toBeDefined();
      expect(tag.name).toBe('Tag Test');
    });
    it('should update a tag', async () => {
      const tag = await Tag.create({
        tenantId: testTenant._id,
        name: 'Tag Test',
        color: '#ff0000'
      });
      tag.color = '#00ff00';
      await tag.save();
      const updated = await Tag.findById(tag._id);
      expect(updated.color).toBe('#00ff00');
    });
    it('should delete a tag', async () => {
      const tag = await Tag.create({
        tenantId: testTenant._id,
        name: 'Tag Test',
        color: '#ff0000'
      });
      await Tag.findByIdAndDelete(tag._id);
      const deleted = await Tag.findById(tag._id);
      expect(deleted).toBeNull();
    });
    it('should require tenantId, name', async () => {
      const tag = new Tag({});
      let err;
      try { await tag.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.name).toBeDefined();
    });
    it('should set default color', async () => {
      const tag = await Tag.create({ tenantId: testTenant._id, name: 'T' });
      expect(tag.color).toBe('#cccccc');
    });
  });

  describe('Attachment Model', () => {
    it('should create an attachment', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clienteatt.testcrm@example.com'
      });
      const attachment = new Attachment({
        tenantId: testTenant._id,
        fileUrl: 'https://example.com/file.pdf',
        originalName: 'file.pdf',
        uploadedBy: testUser._id,
        relatedTo: { customerId: customer._id },
        type: 'pdf',
        size: 12345
      });
      await attachment.save();
      expect(attachment._id).toBeDefined();
      expect(attachment.fileUrl).toBe('https://example.com/file.pdf');
    });
    it('should update an attachment', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clienteatt.testcrm@example.com'
      });
      const attachment = await Attachment.create({
        tenantId: testTenant._id,
        fileUrl: 'https://example.com/file.pdf',
        originalName: 'file.pdf',
        uploadedBy: testUser._id,
        relatedTo: { customerId: customer._id },
        type: 'pdf',
        size: 12345
      });
      attachment.type = 'image';
      await attachment.save();
      const updated = await Attachment.findById(attachment._id);
      expect(updated.type).toBe('image');
    });
    it('should delete an attachment', async () => {
      const customer = await Customer.create({
        tenantId: testTenant._id,
        firstName: 'Cliente',
        lastName: 'Test',
        email: 'clienteatt.testcrm@example.com'
      });
      const attachment = await Attachment.create({
        tenantId: testTenant._id,
        fileUrl: 'https://example.com/file.pdf',
        originalName: 'file.pdf',
        uploadedBy: testUser._id,
        relatedTo: { customerId: customer._id },
        type: 'pdf',
        size: 12345
      });
      await Attachment.findByIdAndDelete(attachment._id);
      const deleted = await Attachment.findById(attachment._id);
      expect(deleted).toBeNull();
    });
    it('should require tenantId, fileUrl, originalName, uploadedBy', async () => {
      const att = new Attachment({});
      let err;
      try { await att.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.fileUrl).toBeDefined();
      expect(err.errors.originalName).toBeDefined();
      expect(err.errors.uploadedBy).toBeDefined();
    });
  });
}); 