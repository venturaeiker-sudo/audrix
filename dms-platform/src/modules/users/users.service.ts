import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, tenantId: string) {
    const existing = await this.prisma.users.findUnique({
      where: {
        tenant_id_email: { tenant_id: tenantId, email: createUserDto.email },
      },
    });

    if (existing) {
      throw new ConflictException('Email already exists in this tenant');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    return this.prisma.users.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        phone: createUserDto.phone,
        branch_id: createUserDto.branch_id,
        tenant_id: tenantId,
      },
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
    });
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.users.findFirst({
      where: { tenant_id: tenantId, email },
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
    });
  }

  async findAll(tenantId: string, filters?: { isActive?: boolean; branchId?: string }) {
    const where: any = { tenant_id: tenantId };
    if (filters?.isActive !== undefined) where.is_active = filters.isActive;
    if (filters?.branchId) where.branch_id = filters.branchId;

    return this.prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        is_active: true,
        is_verified: true,
        last_login_at: true,
        created_at: true,
        branch: { select: { id: true, name: true, code: true } },
        roles: { include: { role: { select: { id: true, name: true } } } },
      },
      orderBy: { first_name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async update(id: string, tenantId: string, updateUserDto: UpdateUserDto) {
    // Verify ownership before updating
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    // Check email uniqueness if changing email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken = await this.prisma.users.findFirst({
        where: { tenant_id: tenantId, email: updateUserDto.email, id: { not: id } },
      });
      if (emailTaken) throw new ConflictException('Email already in use');
    }

    return this.prisma.users.update({
      where: { id },
      data,
      include: {
        branch: true,
        roles: { include: { role: true } },
      },
    });
  }

  async deactivate(id: string, tenantId: string) {
    const user = await this.prisma.users.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    return this.prisma.users.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });
  }
}
