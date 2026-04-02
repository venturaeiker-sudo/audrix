import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto, tenantId: string) {
    const code = createBranchDto.code.toUpperCase();

    const existing = await this.prisma.branches.findFirst({
      where: { tenant_id: tenantId, code },
    });
    if (existing) {
      throw new ConflictException(`Branch code "${code}" already exists`);
    }

    return this.prisma.branches.create({
      data: {
        ...createBranchDto,
        code,
        tenant_id: tenantId,
      },
    });
  }

  async findAll(tenantId: string, onlyActive = true) {
    return this.prisma.branches.findMany({
      where: {
        tenant_id: tenantId,
        ...(onlyActive ? { is_active: true } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const branch = await this.prisma.branches.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!branch) throw new NotFoundException(`Branch #${id} not found`);
    return branch;
  }

  async update(id: string, tenantId: string, updateBranchDto: UpdateBranchDto) {
    const branch = await this.prisma.branches.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!branch) throw new NotFoundException(`Branch #${id} not found`);

    if (updateBranchDto.code) {
      const code = updateBranchDto.code.toUpperCase();
      const codeTaken = await this.prisma.branches.findFirst({
        where: { tenant_id: tenantId, code, id: { not: id } },
      });
      if (codeTaken) {
        throw new ConflictException(`Branch code "${code}" already in use`);
      }
      updateBranchDto.code = code;
    }

    return this.prisma.branches.update({
      where: { id },
      data: updateBranchDto,
    });
  }

  async deactivate(id: string, tenantId: string) {
    const branch = await this.prisma.branches.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!branch) throw new NotFoundException(`Branch #${id} not found`);

    return this.prisma.branches.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
