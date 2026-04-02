import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Called by LocalStrategy — validates email + password within the tenant.
   * tenantId is resolved from the x-tenant-id header before this call.
   */
  async validateUser(email: string, password: string, tenantId: string): Promise<any> {
    const user = await this.usersService.findByEmail(email, tenantId);

    if (!user) return null;
    if (!user.is_active) return null;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    const { password: _pw, ...result } = user;
    return result;
  }

  /**
   * Called after LocalStrategy succeeds — builds JWT and returns tokens.
   */
  async login(user: any, ipAddress?: string, userAgent?: string) {
    const roleNames = user.roles?.map((r: any) => r.role.name) ?? [];

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      branchId: user.branch_id ?? null,
      roles: roleNames,
    };

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Audit log
    await this.auditLogsService.log({
      tenantId: user.tenant_id,
      userId: user.id,
      entityType: 'users',
      entityId: user.id,
      action: 'LOGIN',
      ipAddress,
      userAgent,
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        tenantId: user.tenant_id,
        branchId: user.branch_id,
        roles: roleNames,
      },
    };
  }

  async logout(userId: string, tenantId: string) {
    await this.auditLogsService.log({
      tenantId,
      userId,
      entityType: 'users',
      entityId: userId,
      action: 'LOGOUT',
    });
    return { message: 'Logged out successfully' };
  }
}
