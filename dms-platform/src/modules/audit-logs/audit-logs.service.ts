import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface LogParams {
  tenantId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  changesBefore?: any;
  changesAfter?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogParams) {
    const {
      tenantId,
      userId,
      entityType,
      entityId,
      action,
      changesBefore,
      changesAfter,
      ipAddress,
      userAgent,
    } = params;

    return this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        action,
        changes_json:
          changesBefore || changesAfter
            ? { before: changesBefore ?? null, after: changesAfter ?? null }
            : undefined,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  }

  async findAll(tenantId: string, filters?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (filters?.entityType) where.entity_type = filters.entityType;
    if (filters?.entityId) where.entity_id = filters.entityId;
    if (filters?.userId) where.user_id = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.from || filters?.to) {
      where.created_at = {};
      if (filters.from) where.created_at.gte = filters.from;
      if (filters.to) where.created_at.lte = filters.to;
    }

    const [data, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true, email: true },
          },
        },
      }),
      this.prisma.audit_logs.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
