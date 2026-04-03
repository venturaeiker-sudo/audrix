import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth('JWT')
@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @ApiOperation({ summary: 'Crear rol en el tenant' })
  @ApiResponse({ status: 201, description: 'Rol creado.' })
  @Post()
  @Roles('Admin')
  create(@Body() createRoleDto: CreateRoleDto, @Request() req) {
    return this.rolesService.create(createRoleDto, req.tenantId);
  }

  @ApiOperation({ summary: 'Listar roles del tenant con sus permisos' })
  @Get()
  @Roles('Admin', 'Manager')
  findAll(@Request() req) {
    return this.rolesService.findAll(req.tenantId);
  }

  @ApiOperation({ summary: 'Catálogo completo de permisos disponibles' })
  @Get('permissions')
  @Roles('Admin')
  findAllPermissions(@Request() req) {
    return this.rolesService.findAllPermissions(req.tenantId);
  }

  @ApiOperation({ summary: 'Obtener rol con permisos' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.rolesService.findOne(id, req.tenantId);
  }

  @ApiOperation({ summary: 'Asignar permisos a un rol' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @Post(':id/permissions')
  @Roles('Admin')
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionDto,
    @Request() req,
  ) {
    return this.rolesService.assignPermissions(id, req.tenantId, dto);
  }

  @ApiOperation({ summary: 'Revocar permiso de un rol' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiParam({ name: 'permissionId', description: 'ID del permiso' })
  @Delete(':id/permissions/:permissionId')
  @Roles('Admin')
  revokePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @Request() req,
  ) {
    return this.rolesService.revokePermission(id, permissionId, req.tenantId);
  }

  @ApiOperation({ summary: 'Asignar rol a un usuario' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @Post(':id/users/:userId')
  @Roles('Admin')
  assignRoleToUser(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.rolesService.assignRoleToUser(
      userId,
      roleId,
      req.tenantId,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: 'Revocar rol de un usuario' })
  @ApiParam({ name: 'id', description: 'ID del rol' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @Delete(':id/users/:userId')
  @Roles('Admin')
  revokeRoleFromUser(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.rolesService.revokeRoleFromUser(userId, roleId, req.tenantId);
  }
}
