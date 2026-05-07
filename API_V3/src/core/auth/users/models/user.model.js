const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const RoleService = require('../../roles/services/role.service');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { 
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Índices
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ tenantId: 1 });

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  try {
    // Solo hashear si la contraseña ha sido modificada
    if (!this.isModified('password')) {
      return next();
    }

    // Generar un salt y hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Método estático para buscar por credenciales
userSchema.statics.findByCredentials = async function(username, password) {
  const user = await this.findOne({ username }).select('+password');
  if (!user) {
    return null;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return null;
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);