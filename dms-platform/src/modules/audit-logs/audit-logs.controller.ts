import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @ApiOperation({ summary: 'Consultar logs de auditoría del tenant' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Tipo de entidad (Customer, User, CashSession…)' })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha fin (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de logs.' })
  @Get()
  @Roles('Admin', 'Manager')
  findAll(
    @Request() req,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogsService.findAll(req.tenantId, {
      entityType,
      entityId,
      userId,
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
}
