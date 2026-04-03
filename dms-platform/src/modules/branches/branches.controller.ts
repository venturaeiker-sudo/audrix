import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Branches')
@ApiBearerAuth('JWT')
@Controller('branches')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiResponse({ status: 201, description: 'Sucursal creada.' })
  @Post()
  @Roles('Admin')
  create(@Body() createBranchDto: CreateBranchDto, @Request() req) {
    return this.branchesService.create(createBranchDto, req.tenantId);
  }

  @ApiOperation({ summary: 'Listar sucursales del tenant' })
  @ApiQuery({ name: 'all', required: false, type: Boolean, description: 'Si es true, incluye sucursales inactivas' })
  @Get()
  @Roles('Admin', 'Manager', 'Cashier', 'Salesperson')
  findAll(@Request() req, @Query('all') all?: string) {
    return this.branchesService.findAll(req.tenantId, all !== 'true');
  }

  @ApiOperation({ summary: 'Obtener sucursal por ID' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal' })
  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.branchesService.findOne(id, req.tenantId);
  }

  @ApiOperation({ summary: 'Actualizar sucursal' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal' })
  @Patch(':id')
  @Roles('Admin')
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @Request() req,
  ) {
    return this.branchesService.update(id, req.tenantId, updateBranchDto);
  }

  @ApiOperation({ summary: 'Desactivar sucursal' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal' })
  @Delete(':id')
  @Roles('Admin')
  deactivate(@Param('id') id: string, @Request() req) {
    return this.branchesService.deactivate(id, req.tenantId);
  }
}
