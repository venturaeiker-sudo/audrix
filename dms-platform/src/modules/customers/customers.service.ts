import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCustomerDto, tenantId: string) {
    if (createDto.identification_number) {
      const existing = await this.prisma.customers.findFirst({
        where: {
          tenant_id: tenantId,
          identification_number: createDto.identification_number,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Customer with identification "${createDto.identification_number}" already exists`,
        );
      }
    }

    return this.prisma.customers.create({
      data: {
        ...createDto,
        tenant_id: tenantId,
      },
      include: {
        branch: true,
        assigned_user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });
  }

  async findAll(
    tenantId: string,
    filters?: {
      status?: string;
      assigned_to?: string;
      branch_id?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.assigned_to) where.assigned_to = filters.assigned_to;
    if (filters?.branch_id) where.branch_id = filters.branch_id;
    if (filters?.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { identification_number: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customers.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          assigned_user: {
            select: { id: true, first_name: true, last_name: true },
          },
          vehicles: { take: 3, orderBy: { id: 'desc' } },
          financing_contracts: {
            take: 3,
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              contract_number: true,
              status: true,
              remaining_balance: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.customers.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const customer = await this.prisma.customers.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        branch: true,
        assigned_user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        vehicles: true,
        financing_contracts: {
          orderBy: { created_at: 'desc' },
        },
        vehicle_registrations: true,
        payments: {
          take: 10,
          orderBy: { received_at: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    return customer;
  }

  async findByIdentification(identificationNumber: string, tenantId: string) {
    return this.prisma.customers.findFirst({
      where: { tenant_id: tenantId, identification_number: identificationNumber },
    });
  }

  async update(id: string, tenantId: string, updateDto: UpdateCustomerDto) {
    const customer = await this.prisma.customers.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);

    if (
      updateDto.identification_number &&
      updateDto.identification_number !== customer.identification_number
    ) {
      const idTaken = await this.prisma.customers.findFirst({
        where: {
          tenant_id: tenantId,
          identification_number: updateDto.identification_number,
          id: { not: id },
        },
      });
      if (idTaken) {
        throw new ConflictException(
          `Customer with identification "${updateDto.identification_number}" already exists`,
        );
      }
    }

    return this.prisma.customers.update({
      where: { id },
      data: updateDto,
      include: {
        branch: true,
        assigned_user: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });
  }
}
