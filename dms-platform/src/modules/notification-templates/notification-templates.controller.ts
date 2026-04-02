import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  NotificationTemplatesService,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from './notification-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notification-templates')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class NotificationTemplatesController {
  constructor(
    private notificationTemplatesService: NotificationTemplatesService,
  ) {}

  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateNotificationTemplateDto, @Request() req) {
    return this.notificationTemplatesService.create(dto, req.tenantId);
  }

  @Get()
  @Roles('Admin', 'Manager')
  findAll(@Request() req, @Query('active') active?: string) {
    return this.notificationTemplatesService.findAll(
      req.tenantId,
      active === 'true',
    );
  }

  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.notificationTemplatesService.findOne(id, req.tenantId);
  }

  @Patch(':id')
  @Roles('Admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @Request() req,
  ) {
    return this.notificationTemplatesService.update(id, req.tenantId, dto);
  }
}
