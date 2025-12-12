import { hasPermission, checkPermission, ADMIN_PERMISSIONS } from '../adminPermissions';

describe('adminPermissions', () => {
  it('should return true when super_admin checks any permission', () => {
    const result = hasPermission('super_admin', ADMIN_PERMISSIONS.USER_MANAGEMENT);
    expect(result).toBe(true);
  });

  it('should return false when branch_admin checks system_settings permission', () => {
    const result = hasPermission('branch_admin', ADMIN_PERMISSIONS.SYSTEM_SETTINGS);
    expect(result).toBe(false);
  });

  it('should return true when finance_admin checks fee_management permission', () => {
    const result = hasPermission('finance_admin', ADMIN_PERMISSIONS.FEE_MANAGEMENT);
    expect(result).toBe(true);
  });

  it('should throw error when checkPermission fails', () => {
    expect(() => {
      checkPermission('branch_admin', ADMIN_PERMISSIONS.SYSTEM_SETTINGS);
    }).toThrow('Insufficient permissions');
  });
});
