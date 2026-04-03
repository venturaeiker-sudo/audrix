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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Crear usuario en el tenant' })
  @ApiResponse({ status: 201, description: 'Usuario creado.' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente.' })
  @Post()
  @Roles('Admin')
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.tenantId);
  }

  @ApiOperation({ summary: 'Listar usuarios del tenant' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de usuarios.' })
  @Get()
  @Roles('Admin', 'Manager')
  findAll(
    @Request() req,
    @Query('isActive') isActive?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.usersService.findAll(req.tenantId, {
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      branchId,
    });
  }

  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.tenantId);
  }

  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @Patch(':id')
  @Roles('Admin')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, req.tenantId, updateUserDto);
  }

  @ApiOperation({ summary: 'Desactivar usuario (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @Delete(':id')
  @Roles('Admin')
  deactivate(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivate(id, req.tenantId);
  }
}
