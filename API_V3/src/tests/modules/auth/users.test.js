const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../core/auth/users/models/user.model');
const Role = require('../../../core/auth/roles/models/role.model');

describe('Users Module Tests', () => {
  let testTenantId, testRole;

  beforeEach(async () => {
    testTenantId = new mongoose.Types.ObjectId();
    
    // Crear rol de prueba
    testRole = new Role({
      name: 'Test Role',
      displayName: 'Test Role',
      description: 'Role for users',
      type: 'custom',
      permissions: [],
      tenantId: testTenantId,
      isActive: true,
      level: 1
    });
    await testRole.save();
  });

  describe('User Creation and Management', () => {
    test('should create a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john.doe@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id],
        isActive: true
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john.doe@example.com');
      expect(user.tenantId.toString()).toBe(testTenantId.toString());
      expect(user.roles[0].toString()).toBe(testRole._id.toString());
      expect(user.isActive).toBe(true);
    });

    test('should hash password on save', async () => {
      const user = new User({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane.smith@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });
      await user.save();

      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt hash pattern
    });

    test('should not create user with duplicate email', async () => {
      const user1 = new User({
        firstName: 'User1',
        lastName: 'Test',
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });
      await user1.save();

      const user2 = new User({
        firstName: 'User2',
        lastName: 'Test',
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user2.save()).rejects.toThrow();
    });

    test('should not create user with duplicate username', async () => {
      const user1 = new User({
        firstName: 'User1',
        lastName: 'Test',
        username: 'duplicate_username',
        email: 'user1@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });
      await user1.save();

      const user2 = new User({
        firstName: 'User2',
        lastName: 'Test',
        username: 'duplicate_username',
        email: 'user2@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user2.save()).rejects.toThrow();
    });

    test('should not allow same email/username in different tenants', async () => {
      const tenant2Id = new mongoose.Types.ObjectId();
      const role2 = new Role({
        name: 'Test Role 2',
        displayName: 'Test Role 2',
        description: 'Role for users',
        type: 'custom',
        permissions: [],
        tenantId: tenant2Id,
        isActive: true,
        level: 1
      });
      await role2.save();

      const user1 = new User({
        firstName: 'User1',
        lastName: 'Test',
        username: 'same_username',
        email: 'same@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });
      await user1.save();

      const user2 = new User({
        firstName: 'User2',
        lastName: 'Test',
        username: 'same_username',
        email: 'same@example.com',
        password: 'password123',
        tenantId: tenant2Id,
        roles: [role2._id]
      });

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      // Crear usuarios de prueba
      const users = [
        {
          firstName: 'Admin',
          lastName: 'User',
          username: 'admin',
          email: 'admin@example.com',
          password: 'password123',
          tenantId: testTenantId,
          roles: [testRole._id],
          isActive: true
        },
        {
          firstName: 'Manager',
          lastName: 'User',
          username: 'manager',
          email: 'manager@example.com',
          password: 'password123',
          tenantId: testTenantId,
          roles: [testRole._id],
          isActive: true
        },
        {
          firstName: 'Regular',
          lastName: 'User',
          username: 'regular',
          email: 'regular@example.com',
          password: 'password123',
          tenantId: testTenantId,
          roles: [testRole._id],
          isActive: false
        }
      ];

      for (const userData of users) {
        const user = new User(userData);
        await user.save();
      }
    });

    test('should find all active users for tenant', async () => {
      const activeUsers = await User.find({
        tenantId: testTenantId,
        isActive: true
      });

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.every(user => user.isActive)).toBe(true);
    });

    test('should find user by email and tenant', async () => {
      const user = await User.findOne({
        email: 'admin@example.com',
        tenantId: testTenantId
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('admin@example.com');
    });

    test('should find user by username and tenant', async () => {
      const user = await User.findOne({
        username: 'manager',
        tenantId: testTenantId
      });

      expect(user).toBeDefined();
      expect(user.username).toBe('manager');
    });

    test('should update user successfully', async () => {
      const user = await User.findOne({ email: 'manager@example.com', tenantId: testTenantId });
      
      user.firstName = 'Updated';
      user.lastName = 'Name';
      user.isActive = false;
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.lastName).toBe('Name');
      expect(updatedUser.isActive).toBe(false);
    });

    test('should delete user successfully', async () => {
      const user = await User.findOne({ email: 'regular@example.com', tenantId: testTenantId });
      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('User Validation', () => {
    test('should require firstName field', async () => {
      const user = new User({
        lastName: 'Doe',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require lastName field', async () => {
      const user = new User({
        firstName: 'John',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require username field', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require email field', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require password field', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
        email: 'test@example.com',
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should require tenantId field', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        roles: [testRole._id]
      });

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate password length', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
        email: 'test@example.com',
        password: '123', // Muy corto
        tenantId: testTenantId,
        roles: [testRole._id]
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    test('should compare password correctly', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });
      await user.save();

      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    test('should update password and hash it', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        tenantId: testTenantId,
        roles: [testRole._id]
      });
      await user.save();

      const oldPasswordHash = user.password;
      user.password = 'newpassword123';
      await user.save();

      expect(user.password).not.toBe(oldPasswordHash);
      expect(user.password).not.toBe('newpassword123');
      
      const isMatch = await user.comparePassword('newpassword123');
      expect(isMatch).toBe(true);
    });
  });
}); 