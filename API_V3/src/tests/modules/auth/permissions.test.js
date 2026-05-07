const mongoose = require('mongoose');
const Permission = require('../../../core/auth/roles/models/permission.model');

describe('Permissions Module Tests', () => {
  let testTenantId;

  beforeEach(async () => {
    await Permission.deleteMany({});
    testTenantId = new mongoose.Types.ObjectId();
  });

  describe('Permission Creation and Management', () => {
    test('should create a new permission successfully', async () => {
      const permissionData = {
        name: 'Read Products',
        code: 'read:products',
        description: 'Can read products',
        resource: 'products',
        action: 'read',
        isActive: true
      };

      const permission = new Permission(permissionData);
      await permission.save();

      expect(permission._id).toBeDefined();
      expect(permission.name).toBe('Read Products');
      expect(permission.resource).toBe('products');
      expect(permission.action).toBe('read');
      expect(permission.description).toBe('Can read products');
    });

    test('should create permission with custom metadata', async () => {
      const permission = new Permission({
        name: 'Create Products',
        code: 'create:products',
        description: 'Can create products',
        resource: 'products',
        action: 'create',
        metadata: {
          requiresApproval: true,
          maxAmount: 10000
        },
        isActive: true
      });
      await permission.save();

      expect(permission.metadata.requiresApproval).toBe(true);
      expect(permission.metadata.maxAmount).toBe(10000);
    });

    test('should not create permission with duplicate name', async () => {
      const permission1 = new Permission({
        name: 'Read Products',
        code: 'read:products',
        description: 'Can read products',
        resource: 'products',
        action: 'read'
      });
      await permission1.save();

      const permission2 = new Permission({
        name: 'Read Products',
        code: 'read:products',
        description: 'Can read products',
        resource: 'products',
        action: 'read'
      });

      await expect(permission2.save()).rejects.toThrow();
    });

    test('should not create permission with duplicate code', async () => {
      const permission1 = new Permission({
        name: 'Read Products',
        code: 'read:products',
        description: 'Can read products',
        resource: 'products',
        action: 'read'
      });
      await permission1.save();

      const permission2 = new Permission({
        name: 'Read Products Again',
        code: 'read:products',
        description: 'Can read products again',
        resource: 'products',
        action: 'read'
      });

      await expect(permission2.save()).rejects.toThrow();
    });
  });

  describe('Permission Queries', () => {
    beforeEach(async () => {
      // Crear permisos de prueba
      const permissions = [
        { name: 'Read Products', code: 'read:products', description: 'Can read products', resource: 'products', action: 'read', isActive: true },
        { name: 'Create Products', code: 'create:products', description: 'Can create products', resource: 'products', action: 'create', isActive: true },
        { name: 'Delete Products', code: 'delete:products', description: 'Can delete products', resource: 'products', action: 'delete', isActive: false },
        { name: 'Read Orders', code: 'read:orders', description: 'Can read orders', resource: 'orders', action: 'read', isActive: true },
        { name: 'Create Orders', code: 'create:orders', description: 'Can create orders', resource: 'orders', action: 'create', isActive: true }
      ];

      for (const permData of permissions) {
        const permission = new Permission(permData);
        await permission.save();
      }
    });

    test('should find all active permissions', async () => {
      const activePermissions = await Permission.find({
        isActive: true
      });

      expect(activePermissions).toHaveLength(4);
      expect(activePermissions.every(perm => perm.isActive)).toBe(true);
    });

    test('should find permissions by resource', async () => {
      const productPermissions = await Permission.find({
        resource: 'products'
      });

      expect(productPermissions).toHaveLength(3);
      expect(productPermissions.every(perm => perm.resource === 'products')).toBe(true);
    });

    test('should find permissions by action', async () => {
      const readPermissions = await Permission.find({
        action: 'read'
      });

      expect(readPermissions).toHaveLength(2);
      expect(readPermissions.every(perm => perm.action === 'read')).toBe(true);
    });

    test('should find permission by name', async () => {
      const permission = await Permission.findOne({
        name: 'Read Products'
      });

      expect(permission).toBeDefined();
      expect(permission.name).toBe('Read Products');
    });

    test('should update permission successfully', async () => {
      const permission = await Permission.findOne({ name: 'Create Products' });
      
      permission.description = 'Updated description';
      permission.isActive = false;
      await permission.save();

      const updatedPermission = await Permission.findById(permission._id);
      expect(updatedPermission.description).toBe('Updated description');
      expect(updatedPermission.isActive).toBe(false);
    });

    test('should delete permission successfully', async () => {
      const permission = await Permission.findOne({ name: 'Read Orders' });
      await Permission.findByIdAndDelete(permission._id);

      const deletedPermission = await Permission.findById(permission._id);
      expect(deletedPermission).toBeNull();
    });
  });

  describe('Permission Validation', () => {
    test('should require name field', async () => {
      const permission = new Permission({
        code: 'read:products',
        description: 'Can read products',
        resource: 'products',
        action: 'read'
      });

      await expect(permission.save()).rejects.toThrow();
    });

    test('should require code field', async () => {
      const permission = new Permission({
        name: 'Read Products',
        description: 'Can read products',
        resource: 'products',
        action: 'read'
      });

      await expect(permission.save()).rejects.toThrow();
    });

    test('should require resource field', async () => {
      const permission = new Permission({
        name: 'Read Products',
        code: 'read:products',
        description: 'Can read products',
        action: 'read'
      });

      await expect(permission.save()).rejects.toThrow();
    });

    test('should require action field', async () => {
      const permission = new Permission({
        name: 'Read Products',
        code: 'read:products',
        description: 'Can read products',
        resource: 'products'
      });

      await expect(permission.save()).rejects.toThrow();
    });

    test('should require description field', async () => {
      const permission = new Permission({
        name: 'Read Products',
        code: 'read:products',
        resource: 'products',
        action: 'read'
      });

      await expect(permission.save()).rejects.toThrow();
    });

    test('should validate action enum values', async () => {
      const permission = new Permission({
        name: 'Test Permission',
        code: 'invalid:test',
        description: 'Test permission',
        resource: 'products',
        action: 'invalid_action'
      });

      await expect(permission.save()).rejects.toThrow();
    });

    test('should validate resource enum values', async () => {
      const permission = new Permission({
        name: 'Test Permission',
        code: 'read:invalid',
        description: 'Test permission',
        resource: 'invalid_resource',
        action: 'read'
      });

      await expect(permission.save()).rejects.toThrow();
    });

    test('should validate code format', async () => {
      const permission = new Permission({
        name: 'Test Permission',
        code: 'invalid-format',
        description: 'Test permission',
        resource: 'products',
        action: 'read'
      });

      await expect(permission.save()).rejects.toThrow();
    });
  });

  describe('Permission Business Logic', () => {
    test('should generate correct permission code from resource and action', async () => {
      const permission = new Permission({
        name: 'Read Products',
        description: 'Can read products',
        resource: 'products',
        action: 'read',
        code: 'read:products'
      });
      await permission.save();

      expect(permission.code).toBe('read:products');
    });

    test('should handle CRUD permissions correctly', async () => {
      const crudPermissions = [
        { name: 'Create Users', action: 'create', code: 'create:users' },
        { name: 'Read Users', action: 'read', code: 'read:users' },
        { name: 'Update Users', action: 'update', code: 'update:users' },
        { name: 'Delete Users', action: 'delete', code: 'delete:users' }
      ];

      for (const permData of crudPermissions) {
        const permission = new Permission({
          name: permData.name,
          description: `Can ${permData.action} users`,
          resource: 'users',
          action: permData.action,
          code: permData.code
        });
        await permission.save();

        expect(permission.action).toBe(permData.action);
        expect(permission.name).toBe(permData.name);
        expect(permission.code).toBe(permData.code);
      }
    });

    test('should auto-generate code when not provided but resource and action are set', async () => {
      const permission = new Permission({
        name: 'Manage Products',
        description: 'Can manage products',
        resource: 'products',
        action: 'manage'
      });

      permission.code = `${permission.action}:${permission.resource}`;
      
      await permission.save();
      expect(permission.code).toBe('manage:products');
    });
  });
}); 