const mongoose = require('mongoose');
const Service = require('../../../features/services/models/Service.model');
const ServiceCategory = require('../../../features/services/models/ServiceCategory.model');
const Tenant = require('../../../core/tenant/models/tenant.model');
const Professional = require('../../../features/professionals/models/Professional.model');
const ServiceCoreService = require('../../../features/services/services/ServiceCoreService');
const ServicePackageService = require('../../../features/services/services/ServicePackageService');
const User = require('../../../core/auth/users/models/user.model');
const ProfessionalType = require('../../../features/professionals/models/ProfessionalType.model');

let tenant;
let category;
let professional;
let serviceCoreService;
let servicePackageService;
let service;
let packageService;

beforeAll(async () => {
  // Conexión a la base de datos si es necesario
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Services Module - ServiceCoreService & ServicePackageService', () => {
  beforeEach(async () => {
    // Limpiar todas las colecciones relevantes
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
    // Crear datos base
    tenant = await Tenant.create({ name: 'Test Tenant' });
    category = await ServiceCategory.create({
      tenantId: tenant._id,
      name: 'Test Category',
      description: 'Test category desc',
    });
    // Crear usuario y tipo de profesional
    const user = await User.create({
      tenantId: tenant._id,
      username: 'pro_user',
      email: 'pro@test.com',
      firstName: 'Pro',
      lastName: 'Fessional',
      password: 'password123'
    });
    const professionalType = await ProfessionalType.create({
      tenantId: tenant._id,
      name: 'General Doctor',
      description: 'Test Doctor Type',
    });
    professional = await Professional.create({
      tenantId: tenant._id,
      userId: user._id,
      professionalType: professionalType._id,
      firstName: 'Pro',
      lastName: 'Fessional',
    });
    serviceCoreService = new ServiceCoreService(tenant._id);
    servicePackageService = new ServicePackageService(tenant._id);
  });

  it('should create a new service', async () => {
    const data = {
      name: 'Test Service',
      description: 'Test desc',
      categoryId: category._id,
      duration: 30,
      price: 100,
      currency: 'USD',
    };
    service = await serviceCoreService.createService(data);
    expect(service).toBeDefined();
    expect(service.name).toBe('Test Service');
    expect(service.tenantId.toString()).toBe(tenant._id.toString());
  });

  it('should get a service by id', async () => {
    const data = {
      name: 'Test Service',
      categoryId: category._id,
      duration: 30,
      price: 100,
      currency: 'USD',
    };
    service = await serviceCoreService.createService(data);
    const found = await serviceCoreService.getServiceById(service._id);
    expect(found).toBeDefined();
    expect(found.name).toBe('Test Service');
  });

  it('should update a service', async () => {
    service = await serviceCoreService.createService({
      name: 'Test Service', categoryId: category._id, duration: 30, price: 100, currency: 'USD'
    });
    const updated = await serviceCoreService.updateService(service._id, { name: 'Updated Service', price: 120 });
    expect(updated.name).toBe('Updated Service');
    expect(updated.price).toBe(120);
  });

  it('should list services', async () => {
    await serviceCoreService.createService({ name: 'A', categoryId: category._id, duration: 30, price: 10, currency: 'USD' });
    await serviceCoreService.createService({ name: 'B', categoryId: category._id, duration: 40, price: 20, currency: 'USD' });
    const result = await serviceCoreService.listServices({});
    expect(result.docs.length).toBeGreaterThanOrEqual(2);
    expect(result.totalDocs).toBeGreaterThanOrEqual(2);
  });

  it('should deactivate a service', async () => {
    service = await serviceCoreService.createService({ name: 'Test Service', categoryId: category._id, duration: 30, price: 100, currency: 'USD' });
    const deactivated = await serviceCoreService.deactivateService(service._id);
    expect(deactivated.isActive).toBe(false);
  });

  it('should add and remove a professional to a service', async () => {
    service = await serviceCoreService.createService({ name: 'Test Service', categoryId: category._id, duration: 30, price: 100, currency: 'USD' });
    const added = await serviceCoreService.addProfessionalToService(service._id, professional._id);
    expect(added.professionals.map(String)).toContain(professional._id.toString());
    const removed = await serviceCoreService.removeProfessionalFromService(service._id, professional._id);
    expect(removed.professionals.map(String)).not.toContain(professional._id.toString());
  });

  it('should create and get a service package', async () => {
    service = await serviceCoreService.createService({ name: 'Test Service', categoryId: category._id, duration: 30, price: 100, currency: 'USD' });
    const pkg = await servicePackageService.createPackage({
      name: 'Test Package',
      description: 'Package desc',
      categoryId: category._id,
      duration: 60,
      price: 200,
      currency: 'USD',
      isPackage: true,
      packageServices: [{ serviceId: service._id, order: 1 }]
    });
    expect(pkg.isPackage).toBe(true);
    packageService = pkg;
    const found = await servicePackageService.getPackageDetails(pkg._id);
    expect(found).toBeDefined();
    expect(found.isPackage).toBe(true);
  });

  // --- Errores y edge cases ---
  it('should throw error for invalid service creation', async () => {
    await expect(serviceCoreService.createService({ name: '', duration: 2, price: -10 })).rejects.toThrow();
  });

  it('should throw 404 for non-existent service', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(serviceCoreService.getServiceById(fakeId)).rejects.toThrow('Service not found');
  });

  it('should throw 404 for update of non-existent service', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(serviceCoreService.updateService(fakeId, { name: 'No existe', duration: 30, price: 10 })).rejects.toThrow('Service not found');
  });

  it('should throw error for invalid update data', async () => {
    service = await serviceCoreService.createService({ name: 'Test Service', categoryId: category._id, duration: 30, price: 100, currency: 'USD' });
    await expect(serviceCoreService.updateService(service._id, { duration: 2 })).rejects.toThrow();
  });

  it('should throw 404 when deactivating non-existent service', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(serviceCoreService.deactivateService(fakeId)).rejects.toThrow('Service not found');
  });

  it('should throw error when adding professional with invalid id', async () => {
    service = await serviceCoreService.createService({ name: 'Test Service', categoryId: category._id, duration: 30, price: 100, currency: 'USD' });
    await expect(serviceCoreService.addProfessionalToService(service._id, new mongoose.Types.ObjectId())).rejects.toThrow();
  });

  it('should throw 404 when adding professional to non-existent service', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(serviceCoreService.addProfessionalToService(fakeId, professional._id)).rejects.toThrow();
  });

  it('should throw 404 when removing professional from non-existent service', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(serviceCoreService.removeProfessionalFromService(fakeId, professional._id)).rejects.toThrow();
  });

  it('should throw error for invalid package creation', async () => {
    await expect(servicePackageService.createPackage({
      name: 'Bad Package',
      duration: 60,
      price: 200,
      isPackage: true,
      packageServices: [] // Debe tener al menos 1
    })).rejects.toThrow();
  });

  it('should throw 404 for non-existent package details', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(servicePackageService.getPackageDetails(fakeId)).rejects.toThrow('Service package not found');
  });
}); 