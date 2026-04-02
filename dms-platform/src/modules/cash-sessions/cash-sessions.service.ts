import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';

@Injectable()
export class CashSessionsService {
  constructor(private prisma: PrismaService) {}

  async open(openDto: OpenCashSessionDto, tenantId: string, userId: string) {
    // Verify branch exists and belongs to tenant
    const branch = await this.prisma.branches.findFirst({
      where: { id: openDto.branch_id, tenant_id: tenantId, is_active: true },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found or inactive');
    }

    // Prevent double-opening: one open session per user per branch
    const existingOpen = await this.prisma.cash_sessions.findFirst({
      where: {
        tenant_id: tenantId,
        branch_id: openDto.branch_id,
        user_id: userId,
        status: 'open',
      },
    });
    if (existingOpen) {
      throw new ConflictException(
        'You already have an open cash session in this branch. Close it first.',
      );
    }

    return this.prisma.cash_sessions.create({
      data: {
        tenant_id: tenantId,
        branch_id: openDto.branch_id,
        user_id: userId,
        opening_amount: openDto.opening_amount,
        notes: openDto.notes,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async close(id: string, tenantId: string, userId: string, closeDto: CloseCashSessionDto) {
    const session = await this.prisma.cash_sessions.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!session) throw new NotFoundException('Cash session not found');
    if (session.status === 'closed') {
      throw new BadRequestException('Cash session is already closed');
    }

    // Calculate total payments received in this session
    const aggregate = await this.prisma.payments.aggregate({
      where: { tenant_id: tenantId, cash_session_id: id },
      _sum: { amount: true },
    });
    const totalPayments = aggregate._sum.amount ?? 0;

    return this.prisma.cash_sessions.update({
      where: { id },
      data: {
        status: 'closed',
        closed_at: new Date(),
        closing_amount: closeDto.closing_amount,
        total_payments: totalPayments,
        notes: closeDto.notes ?? session.notes,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, first_name: true, last_name: true } },
        payments: {
          select: { id: true, amount: true, method: true, received_at: true },
        },
      },
    });
  }

  async getCurrent(tenantId: string, userId: string) {
    return this.prisma.cash_sessions.findFirst({
      where: { tenant_id: tenantId, user_id: userId, status: 'open' },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { payments: true } },
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: {
      branchId?: string;
      userId?: string;
      status?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };
    if (filters?.branchId) where.branch_id = filters.branchId;
    if (filters?.userId) where.user_id = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.from || filters?.to) {
      where.opened_at = {};
      if (filters.from) where.opened_at.gte = filters.from;
      if (filters.to) where.opened_at.lte = filters.to;
    }

    const [data, total] = await Promise.all([
      this.prisma.cash_sessions.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, first_name: true, last_name: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { opened_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cash_sessions.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const session = await this.prisma.cash_sessions.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        branch: true,
        user: { select: { id: true, first_name: true, last_name: true } },
        payments: { orderBy: { received_at: 'desc' } },
      },
    });
    if (!session) throw new NotFoundException(`Cash session #${id} not found`);
    return session;
  }
}
