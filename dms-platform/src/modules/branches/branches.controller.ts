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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('branches')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Post()
  @Roles('Admin')
  create(@Body() createBranchDto: CreateBranchDto, @Request() req) {
    return this.branchesService.create(createBranchDto, req.tenantId);
  }

  @Get()
  @Roles('Admin', 'Manager', 'Cashier', 'Salesperson')
  findAll(@Request() req, @Query('all') all?: string) {
    return this.branchesService.findAll(req.tenantId, all !== 'true');
  }

  @Get(':id')
  @Roles('Admin', 'Manager')
  findOne(@Param('id') id: string, @Request() req) {
    return this.branchesService.findOne(id, req.tenantId);
  }

  @Patch(':id')
  @Roles('Admin')
  update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @Request() req,
  ) {
    return this.branchesService.update(id, req.tenantId, updateBranchDto);
  }

  @Delete(':id')
  @Roles('Admin')
  deactivate(@Param('id') id: string, @Request() req) {
    return this.branchesService.deactivate(id, req.tenantId);
  }
}
