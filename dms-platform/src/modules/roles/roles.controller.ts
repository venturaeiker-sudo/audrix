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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @Roles('Admin')
  create(@Body() createRoleDto: CreateRoleDto, @Request() req) {
    return this.rolesService.create(createRoleDto, req.tenantId);
  }

  @Get()
  @Roles('Admin', 'Manager')
  findAll(@Request() req) {
    return this.rolesService.findAll(req.tenantId);
  }

  @Get('permissions')
  @Roles('Admin')
  findAllPermissions(@Request() req) {
    return this.rolesService.findAllPermissions(req.tenantId);
  }

  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.rolesService.findOne(id, req.tenantId);
  }

  @Post(':id/permissions')
  @Roles('Admin')
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionDto,
    @Request() req,
  ) {
    return this.rolesService.assignPermissions(id, req.tenantId, dto);
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('Admin')
  revokePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @Request() req,
  ) {
    return this.rolesService.revokePermission(id, permissionId, req.tenantId);
  }

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
