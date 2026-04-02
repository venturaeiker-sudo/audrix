import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto, tenantId: string) {
    const existing = await this.prisma.roles.findFirst({
      where: { tenant_id: tenantId, name: createRoleDto.name },
    });
    if (existing) {
      throw new ConflictException(`Role "${createRoleDto.name}" already exists`);
    }

    return this.prisma.roles.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        tenant_id: tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.roles.findMany({
      where: { tenant_id: tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const role = await this.prisma.roles.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        permissions: { include: { permission: true } },
        users: {
          include: {
            user: { select: { id: true, first_name: true, last_name: true, email: true } },
          },
        },
      },
    });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }

  async assignPermissions(roleId: string, tenantId: string, dto: AssignPermissionDto) {
    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, tenant_id: tenantId },
    });
    if (!role) throw new NotFoundException(`Role #${roleId} not found`);

    // Upsert permissions
    const ops = dto.permission_ids.map((permId) =>
      this.prisma.role_permissions.upsert({
        where: { role_id_permission_id: { role_id: roleId, permission_id: permId } },
        create: { role_id: roleId, permission_id: permId },
        update: {},
      }),
    );
    await Promise.all(ops);

    return this.findOne(roleId, tenantId);
  }

  async revokePermission(roleId: string, permissionId: string, tenantId: string) {
    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, tenant_id: tenantId },
    });
    if (!role) throw new NotFoundException(`Role #${roleId} not found`);

    await this.prisma.role_permissions.deleteMany({
      where: { role_id: roleId, permission_id: permissionId },
    });

    return { message: 'Permission revoked' };
  }

  async assignRoleToUser(userId: string, roleId: string, tenantId: string, assignedBy?: string) {
    // Verify role belongs to tenant
    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, tenant_id: tenantId },
    });
    if (!role) throw new NotFoundException(`Role #${roleId} not found in this tenant`);

    // Verify user belongs to tenant
    const user = await this.prisma.users.findFirst({
      where: { id: userId, tenant_id: tenantId },
    });
    if (!user) throw new NotFoundException(`User #${userId} not found in this tenant`);

    return this.prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: userId, role_id: roleId } },
      create: { user_id: userId, role_id: roleId, assigned_by: assignedBy },
      update: { assigned_by: assignedBy },
    });
  }

  async revokeRoleFromUser(userId: string, roleId: string, tenantId: string) {
    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, tenant_id: tenantId },
    });
    if (!role) throw new NotFoundException(`Role #${roleId} not found`);

    if (role.is_system) {
      throw new BadRequestException('Cannot revoke a system role assignment this way');
    }

    await this.prisma.user_roles.deleteMany({
      where: { user_id: userId, role_id: roleId },
    });

    return { message: 'Role revoked from user' };
  }

  // ─── Permissions catalog (per tenant) ────────────────────────────────────────

  async findAllPermissions(tenantId: string) {
    return this.prisma.permissions.findMany({
      where: { tenant_id: tenantId },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }
}
