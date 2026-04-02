import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateNotificationTemplateDto {
  code: string;
  name: string;
  subject_template: string;
  html_template: string;
  is_active?: boolean;
}

export interface UpdateNotificationTemplateDto {
  name?: string;
  subject_template?: string;
  html_template?: string;
  is_active?: boolean;
}

@Injectable()
export class NotificationTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationTemplateDto, tenantId: string) {
    const existing = await this.prisma.notification_templates.findFirst({
      where: { tenant_id: tenantId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Template with code "${dto.code}" already exists`);
    }

    return this.prisma.notification_templates.create({
      data: { ...dto, tenant_id: tenantId },
    });
  }

  async findAll(tenantId: string, onlyActive = false) {
    return this.prisma.notification_templates.findMany({
      where: {
        tenant_id: tenantId,
        ...(onlyActive ? { is_active: true } : {}),
      },
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string, tenantId: string) {
    const template = await this.prisma.notification_templates.findFirst({
      where: { tenant_id: tenantId, code },
    });
    if (!template) throw new NotFoundException(`Template "${code}" not found`);
    return template;
  }

  async findOne(id: string, tenantId: string) {
    const template = await this.prisma.notification_templates.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!template) throw new NotFoundException(`Template #${id} not found`);
    return template;
  }

  async update(id: string, tenantId: string, dto: UpdateNotificationTemplateDto) {
    const template = await this.prisma.notification_templates.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!template) throw new NotFoundException(`Template #${id} not found`);

    return this.prisma.notification_templates.update({
      where: { id },
      data: dto,
    });
  }
}
