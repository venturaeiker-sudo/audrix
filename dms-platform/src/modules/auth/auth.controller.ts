import { Controller, Post, Get, Body, UseGuards, Request, Ip, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login — obtener JWT', description: 'Requiere el header `x-tenant-id` para identificar el tenant.' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID del tenant (concesionario)', required: true, example: 'cmni0wb3c0000tx02ntsdv3np' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna access_token y datos del usuario.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(req.user, ip, userAgent);
  }

  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'Datos del usuario desde el JWT.' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado.' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiOperation({ summary: 'Logout — invalida el token del usuario' })
  @ApiBearerAuth('JWT')
  @ApiResponse({ status: 200, description: 'Logout exitoso.' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId, req.user.tenantId);
  }
}
