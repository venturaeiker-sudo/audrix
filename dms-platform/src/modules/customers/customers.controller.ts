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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Customers')
@ApiBearerAuth('JWT')
@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @ApiOperation({ summary: 'Crear cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado.' })
  @Post()
  @Roles('Admin', 'Manager', 'Salesperson')
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    return this.customersService.create(createCustomerDto, req.tenantId);
  }

  @ApiOperation({ summary: 'Listar clientes (paginado)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, cédula, email o teléfono' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'branch_id', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de clientes.' })
  @Get()
  @Roles('Admin', 'Manager', 'Salesperson', 'Cashier')
  findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('branch_id') branch_id?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.findAll(req.tenantId, {
      status,
      assigned_to,
      branch_id,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @ApiOperation({ summary: 'Obtener cliente por ID (vista 360)' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @Get(':id')
  @Roles('Admin', 'Manager', 'Salesperson', 'Cashier')
  findOne(@Param('id') id: string, @Request() req) {
    return this.customersService.findOne(id, req.tenantId);
  }

  @ApiOperation({ summary: 'Actualizar datos del cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @Patch(':id')
  @Roles('Admin', 'Manager', 'Salesperson')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req,
  ) {
    return this.customersService.update(id, req.tenantId, updateCustomerDto);
  }
}
