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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  NotificationTemplatesService,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from './notification-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Notification Templates')
@ApiBearerAuth('JWT')
@Controller('notification-templates')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class NotificationTemplatesController {
  constructor(
    private notificationTemplatesService: NotificationTemplatesService,
  ) {}

  @ApiOperation({ summary: 'Crear plantilla de notificación' })
  @ApiResponse({ status: 201, description: 'Plantilla creada.' })
  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateNotificationTemplateDto, @Request() req) {
    return this.notificationTemplatesService.create(dto, req.tenantId);
  }

  @ApiOperation({ summary: 'Listar plantillas del tenant' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar solo activas' })
  @Get()
  @Roles('Admin', 'Manager')
  findAll(@Request() req, @Query('active') active?: string) {
    return this.notificationTemplatesService.findAll(
      req.tenantId,
      active === 'true',
    );
  }

  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.notificationTemplatesService.findOne(id, req.tenantId);
  }

  @ApiOperation({ summary: 'Actualizar plantilla' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
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
