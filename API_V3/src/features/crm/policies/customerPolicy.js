function canManageCustomer(user) {
  return user.roles.some(role => ['admin', 'manager', 'superadmin'].includes(role.name));
}

function canViewCustomer(user) {
  return user.roles.length > 0;
}

module.exports = {
  canManageCustomer,
  canViewCustomer
}; 