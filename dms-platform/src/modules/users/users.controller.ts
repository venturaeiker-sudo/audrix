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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles('Admin')
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.tenantId);
  }

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

  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.tenantId);
  }

  @Patch(':id')
  @Roles('Admin')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, req.tenantId, updateUserDto);
  }

  @Delete(':id')
  @Roles('Admin')
  deactivate(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivate(id, req.tenantId);
  }
}
