import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Permission catalog (resources × actions) ─────────────────────────────────
const RESOURCES = [
  'branches',
  'users',
  'roles',
  'customers',
  'cash-sessions',
  'payments',
  'status-definitions',
  'notification-templates',
  'audit-logs',
  'vehicles',
  'financing-contracts',
];
const ACTIONS = ['create', 'read', 'update', 'delete', 'export'];

// Role → permission mapping for seeding
const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: RESOURCES.flatMap((r) => ACTIONS.map((a) => `${r}:${a}`)),
  Manager: [
    'branches:read',
    'users:read', 'users:create', 'users:update',
    'roles:read',
    'customers:create', 'customers:read', 'customers:update', 'customers:export',
    'cash-sessions:create', 'cash-sessions:read',
    'payments:read', 'payments:export',
    'status-definitions:read',
    'notification-templates:read',
    'audit-logs:read',
    'vehicles:read', 'vehicles:create', 'vehicles:update',
    'financing-contracts:read', 'financing-contracts:create', 'financing-contracts:update',
  ],
  Salesperson: [
    'customers:create', 'customers:read', 'customers:update',
    'vehicles:read',
    'financing-contracts:read', 'financing-contracts:create',
    'status-definitions:read',
    'cash-sessions:read',
  ],
  Cashier: [
    'customers:read',
    'cash-sessions:create', 'cash-sessions:read',
    'payments:create', 'payments:read',
    'financing-contracts:read',
  ],
};

// Default dynamic states for the "contract" entity type
const CONTRACT_STATES = [
  { code: 'draft',       label: 'Borrador',    color: '#6c757d', is_initial: true,  is_final: false, sort: 0 },
  { code: 'active',      label: 'Activo',      color: '#28a745', is_initial: false, is_final: false, sort: 1 },
  { code: 'past_due',    label: 'Vencido',     color: '#dc3545', is_initial: false, is_final: false, sort: 2 },
  { code: 'completed',   label: 'Completado',  color: '#17a2b8', is_initial: false, is_final: true,  sort: 3 },
  { code: 'cancelled',   label: 'Cancelado',   color: '#343a40', is_initial: false, is_final: true,  sort: 4 },
];

// Default states for "vehicle_registration"
const REGISTRATION_STATES = [
  { code: 'pending_dgii', label: 'Pendiente DGII',  color: '#ffc107', is_initial: true,  is_final: false, sort: 0 },
  { code: 'plate_ready',  label: 'Placa Lista',      color: '#28a745', is_initial: false, is_final: false, sort: 1 },
  { code: 'delivered',    label: 'Entregada',         color: '#17a2b8', is_initial: false, is_final: false, sort: 2 },
  { code: 'completed',    label: 'Completado',        color: '#6c757d', is_initial: false, is_final: true,  sort: 3 },
];

// Default states for "customer"
const CUSTOMER_STATES = [
  { code: 'active',    label: 'Activo',    color: '#28a745', is_initial: true,  is_final: false, sort: 0 },
  { code: 'inactive',  label: 'Inactivo',  color: '#6c757d', is_initial: false, is_final: false, sort: 1 },
  { code: 'blocked',   label: 'Bloqueado', color: '#dc3545', is_initial: false, is_final: false, sort: 2 },
];

// Default notification templates
const NOTIFICATION_TEMPLATES = [
  {
    code: 'payment_receipt',
    name: 'Recibo de Pago',
    subject_template: 'Recibo de pago - {{contract_number}}',
    html_template: '<p>Estimado {{customer_name}},</p><p>Hemos recibido su pago de <strong>{{amount}}</strong> el {{payment_date}}.</p><p>Contrato: {{contract_number}}</p>',
  },
  {
    code: 'cash_session_close',
    name: 'Cierre de Caja',
    subject_template: 'Resumen de Cierre de Caja - {{branch_name}}',
    html_template: '<p>Caja cerrada por {{user_name}} en {{branch_name}}.</p><p>Monto apertura: {{opening_amount}}</p><p>Monto cierre: {{closing_amount}}</p><p>Total cobrado: {{total_payments}}</p>',
  },
  {
    code: 'plate_ready',
    name: 'Placa Lista para Entregar',
    subject_template: 'Su placa está lista - {{plate_number}}',
    html_template: '<p>Estimado {{customer_name}},</p><p>Nos complace informarle que su placa <strong>{{plate_number}}</strong> está lista para ser retirada.</p>',
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // ─── 1. Create demo tenant ─────────────────────────────────────────────────
  const tenant = await prisma.tenants.upsert({
    where: { rnc: '101-12345-6' },
    update: {},
    create: {
      name: 'Demo Concesionario',
      rnc: '101-12345-6',
      email: 'info@demo-dealer.com',
      phone: '809-555-0100',
      address: 'Av. 27 de Febrero #123, Santo Domingo',
    },
  });
  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── 2. Create branches ────────────────────────────────────────────────────
  const branchSDO = await prisma.branches.upsert({
    where: { code: 'SDO' },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Sucursal Santo Domingo',
      code: 'SDO',
      email: 'sdo@demo-dealer.com',
      phone: '809-555-0101',
      address: 'Av. 27 de Febrero #123, Santo Domingo',
      opened_at: new Date('2024-01-01'),
    },
  });

  const branchSTI = await prisma.branches.upsert({
    where: { code: 'STI' },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Sucursal Santiago',
      code: 'STI',
      email: 'sti@demo-dealer.com',
      phone: '809-555-0102',
      address: 'Av. Juan Pablo Duarte #456, Santiago',
      opened_at: new Date('2024-03-01'),
    },
  });
  console.log(`✅ Branches: ${branchSDO.code}, ${branchSTI.code}`);

  // ─── 3. Seed permission catalog ────────────────────────────────────────────
  const permMap: Record<string, string> = {};
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permissions.upsert({
        where: {
          tenant_id_resource_action: {
            tenant_id: tenant.id,
            resource,
            action,
          },
        },
        update: {},
        create: {
          tenant_id: tenant.id,
          resource,
          action,
          description: `${action} on ${resource}`,
        },
      });
      permMap[`${resource}:${action}`] = perm.id;
    }
  }
  console.log(`✅ Permissions: ${Object.keys(permMap).length} created`);

  // ─── 4. Seed system roles with permissions ─────────────────────────────────
  const roleMap: Record<string, string> = {};
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.roles.upsert({
      where: { tenant_id_name: { tenant_id: tenant.id, name: roleName } },
      update: {},
      create: {
        tenant_id: tenant.id,
        name: roleName,
        description: `System role: ${roleName}`,
        is_system: true,
      },
    });
    roleMap[roleName] = role.id;

    // Assign permissions to role
    for (const permKey of permKeys) {
      if (permMap[permKey]) {
        await prisma.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: role.id,
              permission_id: permMap[permKey],
            },
          },
          update: {},
          create: { role_id: role.id, permission_id: permMap[permKey] },
        });
      }
    }
  }
  console.log(`✅ Roles: ${Object.keys(roleMap).join(', ')}`);

  // ─── 5. Create admin user ──────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@demo-dealer.com' },
    update: {},
    create: {
      tenant_id: tenant.id,
      branch_id: branchSDO.id,
      email: 'admin@demo-dealer.com',
      password: adminPasswordHash,
      first_name: 'Admin',
      last_name: 'Sistema',
      phone: '809-555-0000',
      is_verified: true,
    },
  });

  // Assign Admin role
  await prisma.user_roles.upsert({
    where: { user_id_role_id: { user_id: adminUser.id, role_id: roleMap['Admin'] } },
    update: {},
    create: { user_id: adminUser.id, role_id: roleMap['Admin'] },
  });
  console.log(`✅ Admin user: ${adminUser.email}`);

  // ─── 6. Create cashier demo user ───────────────────────────────────────────
  const cashierHash = await bcrypt.hash('Cashier123!', 12);
  const cashierUser = await prisma.users.upsert({
    where: { email: 'cajero@demo-dealer.com' },
    update: {},
    create: {
      tenant_id: tenant.id,
      branch_id: branchSDO.id,
      email: 'cajero@demo-dealer.com',
      password: cashierHash,
      first_name: 'Juan',
      last_name: 'Cajero',
      phone: '809-555-0001',
      is_verified: true,
    },
  });
  await prisma.user_roles.upsert({
    where: { user_id_role_id: { user_id: cashierUser.id, role_id: roleMap['Cashier'] } },
    update: {},
    create: { user_id: cashierUser.id, role_id: roleMap['Cashier'] },
  });
  console.log(`✅ Cashier user: ${cashierUser.email}`);

  // ─── 7. Seed dynamic states ────────────────────────────────────────────────
  for (const state of CONTRACT_STATES) {
    await prisma.status_definitions.upsert({
      where: {
        tenant_id_entity_type_code: {
          tenant_id: tenant.id,
          entity_type: 'contract',
          code: state.code,
        },
      },
      update: {},
      create: {
        tenant_id: tenant.id,
        entity_type: 'contract',
        code: state.code,
        label: state.label,
        color: state.color,
        is_initial: state.is_initial,
        is_final: state.is_final,
      },
    });
  }
  for (const state of REGISTRATION_STATES) {
    await prisma.status_definitions.upsert({
      where: {
        tenant_id_entity_type_code: {
          tenant_id: tenant.id,
          entity_type: 'vehicle_registration',
          code: state.code,
        },
      },
      update: {},
      create: {
        tenant_id: tenant.id,
        entity_type: 'vehicle_registration',
        code: state.code,
        label: state.label,
        color: state.color,
        is_initial: state.is_initial,
        is_final: state.is_final,
      },
    });
  }
  for (const state of CUSTOMER_STATES) {
    await prisma.status_definitions.upsert({
      where: {
        tenant_id_entity_type_code: {
          tenant_id: tenant.id,
          entity_type: 'customer',
          code: state.code,
        },
      },
      update: {},
      create: {
        tenant_id: tenant.id,
        entity_type: 'customer',
        code: state.code,
        label: state.label,
        color: state.color,
        is_initial: state.is_initial,
        is_final: state.is_final,
      },
    });
  }
  console.log('✅ Dynamic states seeded for: contract, vehicle_registration, customer');

  // ─── 8. Seed notification templates ───────────────────────────────────────
  for (const tmpl of NOTIFICATION_TEMPLATES) {
    await prisma.notification_templates.upsert({
      where: { code: tmpl.code },
      update: {},
      create: { tenant_id: tenant.id, ...tmpl },
    });
  }
  console.log(`✅ Notification templates: ${NOTIFICATION_TEMPLATES.map((t) => t.code).join(', ')}`);

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────');
  console.log('Login credentials:');
  console.log('  Admin:   admin@demo-dealer.com / Admin123!');
  console.log('  Cashier: cajero@demo-dealer.com / Cashier123!');
  console.log('  Header:  x-tenant-id: ' + tenant.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
