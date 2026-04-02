import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Post-auth tenant guard: reads tenantId from the JWT payload (req.user).
 * Use AFTER JwtAuthGuard. Ensures the user's JWT tenant matches
 * the requested resource's tenant (prevents cross-tenant access).
 *
 * For pre-auth tenant scoping (login), use the x-tenant-id header
 * which is handled directly in LocalStrategy.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Populated by JwtAuthGuard

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Tenant context not found in token');
    }

    // Attach tenantId to request for easy access in services
    request.tenantId = user.tenantId;
    return true;
  }
}
