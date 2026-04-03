import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@demo-dealer.com', description: 'Email del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123!', description: 'Contraseña del usuario' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
