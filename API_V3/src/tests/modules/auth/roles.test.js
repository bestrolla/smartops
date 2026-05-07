const mongoose = require('mongoose');
const Role = require('../../../core/auth/roles/models/role.model');
const Permission = require('../../../core/auth/roles/models/permission.model');

describe('Roles Module Tests', () => {
  let testTenantId;

  beforeEach(async () => {
    testTenantId = new mongoose.Types.ObjectId();
  });

  describe('Role Creation and Management', () => {
    test('should create a new role successfully', async () => {
      const roleData = {
        name: 'Test Role',
        displayName: 'Test Role',
        description: 'Role for testing purposes',
        type: 'custom',
        permissions: [],
        tenantId: testTenantId,
        isActive: true,
        level: 1
      };

      const role = new Role(roleData);
      await role.save();

      expect(role._id).toBeDefined();
      expect(role.name).toBe('Test Role');
      expect(role.tenantId.toString()).toBe(testTenantId.toString());
      expect(role.isActive).toBe(true);
      expect(role.type).toBe('custom');
      expect(role.level).toBe(1);
    });

    test('should create role with permissions', async () => {
      // Crear permisos primero
      const permission1 = new Permission({
        name: 'Read Products',
        code: 'read:products',
        description: 'Can read products',
        tenantId: testTenantId,
        resource: 'products',
        action: 'read',
        isActive: true
      });
      await permission1.save();

      const permission2 = new Permission({
        name: 'Create Products',
        code: 'create:products',
        description: 'Can create products',
        tenantId: testTenantId,
        resource: 'products',
        action: 'create',
        isActive: true
      });
      await permission2.save();

      const role = new Role({
        name: 'Product Manager',
        displayName: 'Product Manager',
        description: 'Can manage products',
        type: 'custom',
        permissions: [permission1._id, permission2._id],
        tenantId: testTenantId,
        isActive: true,
        level: 1
      });
      await role.save();

      expect(role.permissions).toHaveLength(2);
      expect(role.permissions).toContain(permission1._id);
      expect(role.permissions).toContain(permission2._id);
    });

    test('should not create role with duplicate name in same tenant', async () => {
      const role1 = new Role({
        name: 'Duplicate Role',
        displayName: 'Duplicate Role',
        description: 'Role for testing',
        type: 'custom',
        permissions: [],
        tenantId: testTenantId,
        isActive: true,
        level: 1
      });
      await role1.save();

      const role2 = new Role({
        name: 'Duplicate Role',
        displayName: 'Duplicate Role',
        description: 'Role for testing',
        type: 'custom',
        permissions: [],
        tenantId: testTenantId,
        isActive: true,
        level: 1
      });

      await expect(role2.save()).rejects.toThrow();
    });

    test('should not allow same role name in different tenants', async () => {
      const tenant2Id = new mongoose.Types.ObjectId();

      const role1 = new Role({
        name: 'Same Name Role',
        displayName: 'Same Name Role',
        description: 'Role for tenant 1',
        type: 'custom',
        permissions: [],
        tenantId: testTenantId,
        isActive: true,
        level: 1
      });
      await role1.save();

      const role2 = new Role({
        name: 'Same Name Role',
        displayName: 'Same Name Role',
        description: 'Role for tenant 2',
        type: 'custom',
        permissions: [],
        tenantId: tenant2Id,
        isActive: true,
        level: 1
      });
      await expect(role2.save()).rejects.toThrow();
    });
  });

  describe('Role Queries', () => {
    beforeEach(async () => {
      // Crear roles de prueba
      const roles = [
        { name: 'Admin', displayName: 'Admin', description: 'Admin role', type: 'custom', permissions: [], tenantId: testTenantId, isActive: true, level: 1 },
        { name: 'Manager', displayName: 'Manager', description: 'Manager role', type: 'custom', permissions: [], tenantId: testTenantId, isActive: true, level: 1 },
        { name: 'User', displayName: 'User', description: 'User role', type: 'custom', permissions: [], tenantId: testTenantId, isActive: false, level: 1 },
        { name: 'Guest', displayName: 'Guest', description: 'Guest role', type: 'custom', permissions: [], tenantId: testTenantId, isActive: true, level: 1 }
      ];

      for (const roleData of roles) {
        const role = new Role(roleData);
        await role.save();
      }
    });

    test('should find all active roles for tenant', async () => {
      const activeRoles = await Role.find({
        tenantId: testTenantId,
        isActive: true
      });

      expect(activeRoles).toHaveLength(3);
      expect(activeRoles.every(role => role.isActive)).toBe(true);
    });

    test('should find role by name and tenant', async () => {
      const role = await Role.findOne({
        name: 'Admin',
        tenantId: testTenantId
      });

      expect(role).toBeDefined();
      expect(role.name).toBe('Admin');
    });

    test('should update role successfully', async () => {
      const role = await Role.findOne({ name: 'Manager', tenantId: testTenantId });
      
      role.description = 'Updated description';
      role.displayName = 'Manager Updated';
      role.isActive = false;
      await role.save();

      const updatedRole = await Role.findById(role._id);
      expect(updatedRole.description).toBe('Updated description');
      expect(updatedRole.displayName).toBe('Manager Updated');
      expect(updatedRole.isActive).toBe(false);
    });

    test('should delete role successfully', async () => {
      const role = await Role.findOne({ name: 'Guest', tenantId: testTenantId });
      await Role.findByIdAndDelete(role._id);

      const deletedRole = await Role.findById(role._id);
      expect(deletedRole).toBeNull();
    });
  });

  describe('Role Validation', () => {
    test('should require name field', async () => {
      const role = new Role({
        displayName: 'Test Role',
        description: 'Role for testing',
        type: 'custom',
        permissions: [],
        tenantId: testTenantId,
        isActive: true,
        level: 1
      });

      await expect(role.save()).rejects.toThrow();
    });

    test('should require tenantId field', async () => {
      const role = new Role({
        name: 'Test Role',
        displayName: 'Test Role',
        description: 'Role for testing',
        type: 'custom',
        permissions: [],
        isActive: true,
        level: 1
      });

      await expect(role.save()).rejects.toThrow();
    });
  });
}); 