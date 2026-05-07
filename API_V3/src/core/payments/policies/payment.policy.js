const { createError } = require('../../../shared/errors.utils');

class PaymentPolicy {
  verifyTenant(user, payment) {
    if (!payment) throw createError(404, 'Pago no encontrado');
    if (payment.status !== 'pending') throw createError(400, 'El pago ya fue procesado');
    
    // Verificar si es superadmin (tiene permiso "admin" o nombre "superadmin")
    const isSuperAdmin = user.roles && user.roles.some(role => 
      role.permissions && role.permissions.includes('admin') || 
      role.name === 'superadmin'
    );

    if (isSuperAdmin) {
        return; // Superadmin tiene permisos para verificar cualquier pago
    }

    // Verificar si es admin del tenant (tiene permiso "all" en ese tenant)
    const isTenantAdmin = user.roles && user.roles.some(role => 
      role.permissions && role.permissions.includes('all') && 
      role.tenantId && role.tenantId.toString() === payment.tenant.toString()
    );
    
    if (!isTenantAdmin) {
      throw createError(403, 'No tienes permisos para verificar este pago');
    }
  }

  verifySubscription(user, payment) {
    if (!payment) throw createError(404, 'Pago no encontrado');
    if (payment.type !== 'subscription') throw createError(400, 'No es un pago de suscripción');
    if (payment.status !== 'pending') throw createError(400, 'El pago ya fue procesado');
    
    // Verificar si es superadmin (tiene permiso "admin" o nombre "superadmin")
    const isSuperAdmin = user.roles && user.roles.some(role => 
      role.permissions && role.permissions.includes('admin') || 
      role.name === 'superadmin'
    );
    
    if (!isSuperAdmin) {
      throw createError(403, 'Se requieren permisos de superadmin');
    }
  }

  reject(user, payment) {
    if (!payment) throw createError(404, 'Pago no encontrado');
    if (payment.status !== 'pending') throw createError(400, 'El pago ya fue procesado');
    
    // Permisos para rechazar (admin del tenant o superadmin)
    const canReject = user.roles && user.roles.some(role => 
      (role.permissions && role.permissions.includes('all') && role.tenantId && role.tenantId.toString() === payment.tenant.toString()) ||
      (role.permissions && role.permissions.includes('admin')) ||
      role.name === 'superadmin'
    );
    
    if (!canReject) {
      throw createError(403, 'No tienes permisos para rechazar este pago');
    }
  }
}

module.exports = new PaymentPolicy();