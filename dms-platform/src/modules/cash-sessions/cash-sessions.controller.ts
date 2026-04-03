import {
  Controller,
  Get,
  Post,
  Body,
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
import { CashSessionsService } from './cash-sessions.service';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Cash Sessions')
@ApiBearerAuth('JWT')
@Controller('cash-sessions')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CashSessionsController {
  constructor(private cashSessionsService: CashSessionsService) {}

  @ApiOperation({ summary: 'Abrir sesión de caja' })
  @ApiResponse({ status: 201, description: 'Caja abierta.' })
  @ApiResponse({ status: 409, description: 'Ya existe una caja abierta para este usuario.' })
  @Post('open')
  @Roles('Admin', 'Manager', 'Cashier')
  open(@Body() openDto: OpenCashSessionDto, @Request() req) {
    return this.cashSessionsService.open(openDto, req.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Cerrar sesión de caja' })
  @ApiParam({ name: 'id', description: 'ID de la sesión de caja' })
  @Post(':id/close')
  @Roles('Admin', 'Manager', 'Cashier')
  close(
    @Param('id') id: string,
    @Body() closeDto: CloseCashSessionDto,
    @Request() req,
  ) {
    return this.cashSessionsService.close(
      id,
      req.tenantId,
      req.user.userId,
      closeDto,
    );
  }

  @ApiOperation({ summary: 'Obtener caja activa del usuario autenticado' })
  @Get('current')
  @Roles('Admin', 'Manager', 'Cashier')
  getCurrent(@Request() req) {
    return this.cashSessionsService.getCurrent(req.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Listar sesiones de caja' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'closed'] })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha inicio (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha fin (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  @Roles('Admin', 'Manager')
  findAll(
    @Request() req,
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cashSessionsService.findAll(req.tenantId, {
      branchId,
      userId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @ApiOperation({ summary: 'Obtener sesión de caja por ID' })
  @ApiParam({ name: 'id', description: 'ID de la sesión de caja' })
  @Get(':id')
  @Roles('Admin', 'Manager', 'Cashier')
  findOne(@Param('id') id: string, @Request() req) {
    return this.cashSessionsService.findOne(id, req.tenantId);
  }
}
