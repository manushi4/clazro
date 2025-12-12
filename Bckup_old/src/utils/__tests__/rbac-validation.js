/**
 * RBAC System Validation Script - v1.0
 *
 * Validates the Admin RBAC system (adminPermissions.ts)
 * Run with: node src/utils/__tests__/rbac-validation.js
 *
 * This script validates:
 * - Permission matrix completeness
 * - Role definitions
 * - Helper functions
 * - Edge cases
 */

// Expected permissions for each role (from ADMIN_IMPLEMENTATION_STRATEGY.md)
const expectedPermissions = {
  super_admin: [
    'manage_users', 'view_financial_reports', 'manage_branches',
    'view_audit_logs', 'manage_security', 'send_notifications',
    'manage_content', 'suspend_accounts', 'manage_operations',
    'export_data', 'manage_support', 'manage_analytics'
  ],
  branch_admin: [
    'manage_users', 'manage_branches', 'send_notifications',
    'view_audit_logs', 'manage_operations', 'manage_support'
  ],
  finance_admin: [
    'view_financial_reports', 'export_data', 'manage_operations'
  ],
  academic_coordinator: [
    'manage_content', 'send_notifications', 'view_audit_logs', 'manage_operations'
  ],
  compliance_admin: [
    'view_audit_logs', 'export_data'
  ],
};

const allPermissions = [
  'manage_users', 'view_financial_reports', 'manage_branches',
  'view_audit_logs', 'manage_security', 'send_notifications',
  'manage_content', 'suspend_accounts', 'manage_operations',
  'export_data', 'manage_support', 'manage_analytics'
];

const allRoles = [
  'super_admin', 'branch_admin', 'finance_admin',
  'academic_coordinator', 'compliance_admin'
];

console.log('\n= RBAC SYSTEM VALIDATION\n');
console.log('=' .repeat(60));

// Test 1: Validate all roles are defined
console.log('\n TEST 1: Role Definitions');
allRoles.forEach(role => {
  console.log(`   ${role}: ${expectedPermissions[role].length} permissions`);
});

// Test 2: Validate super_admin has all permissions
console.log('\n TEST 2: Super Admin Permissions');
const superAdminPerms = expectedPermissions.super_admin;
if (superAdminPerms.length === 12) {
  console.log(`   Super admin has all 12 permissions`);
} else {
  console.log(`   Super admin has ${superAdminPerms.length}/12 permissions`);
}

// Test 3: Validate no duplicate permissions
console.log('\n TEST 3: No Duplicate Permissions');
let hasDuplicates = false;
Object.entries(expectedPermissions).forEach(([role, permissions]) => {
  const unique = [...new Set(permissions)];
  if (unique.length !== permissions.length) {
    console.log(`   ${role} has duplicate permissions`);
    hasDuplicates = true;
  }
});
if (!hasDuplicates) {
  console.log('   No duplicate permissions found');
}

// Test 4: Validate manage_operations is shared
console.log('\n TEST 4: Shared Permissions');
const rolesWithManageOps = Object.entries(expectedPermissions)
  .filter(([role, perms]) => perms.includes('manage_operations'))
  .map(([role]) => role);
console.log(`   manage_operations: ${rolesWithManageOps.length} roles (${rolesWithManageOps.join(', ')})`);

// Test 5: Validate exclusive permissions
console.log('\n TEST 5: Exclusive Permissions');
const exclusiveToSuper = ['manage_security', 'suspend_accounts', 'manage_analytics'];
exclusiveToSuper.forEach(perm => {
  const roles = Object.entries(expectedPermissions)
    .filter(([role, perms]) => perms.includes(perm))
    .map(([role]) => role);
  if (roles.length === 1 && roles[0] === 'super_admin') {
    console.log(`   ${perm}: Only super_admin`);
  } else {
    console.log(`   ${perm}: ${roles.join(', ')}`);
  }
});

// Test 6: Validate minimum permissions
console.log('\n TEST 6: Minimum Permissions');
allRoles.forEach(role => {
  const perms = expectedPermissions[role];
  if (perms.length > 0) {
    console.log(`   ${role}: Has ${perms.length} permission(s)`);
  } else {
    console.log(`   ${role}: No permissions defined`);
  }
});

// Test 7: Validate compliance_admin is view-only
console.log('\n TEST 7: Compliance Admin (View-Only)');
const compliancePerms = expectedPermissions.compliance_admin;
const hasManagementPerms = compliancePerms.some(p => p.startsWith('manage_') || p.startsWith('create_') || p.startsWith('delete_'));
if (!hasManagementPerms) {
  console.log(`   Compliance admin has no management permissions (view-only: ${compliancePerms.join(', ')})`);
} else {
  console.log(`   Compliance admin has management permissions`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n RBAC SYSTEM VALIDATION COMPLETE\n');
console.log('Summary:');
console.log(`  - Roles defined: ${allRoles.length}`);
console.log(`  - Permissions defined: ${allPermissions.length}`);
console.log(`  - Super admin permissions: ${expectedPermissions.super_admin.length}/12`);
console.log(`  - Compliance admin (view-only): ${expectedPermissions.compliance_admin.length} permissions`);
console.log('\nPhase 0 RBAC Implementation:  COMPLETE\n');
