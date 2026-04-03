import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiPropertyOptional({ example: 'juan.perez@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '809-111-2222', description: 'Teléfono principal' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'cedula', enum: ['cedula', 'pasaporte', 'rnc'] })
  @IsString()
  @IsOptional()
  identification_type?: string;

  @ApiPropertyOptional({ example: '001-0000001-1' })
  @IsString()
  @IsOptional()
  identification_number?: string;

  @ApiPropertyOptional({ example: 'Av. 27 de Febrero #123' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Santo Domingo' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'ID del usuario asignado al cliente' })
  @IsString()
  @IsOptional()
  assigned_to?: string;

  @ApiPropertyOptional({ description: 'ID de la sucursal del cliente' })
  @IsString()
  @IsOptional()
  branch_id?: string;

  @ApiPropertyOptional({ example: 750, minimum: 0, maximum: 1000 })
  @IsInt()
  @Min(0)
  @Max(1000)
  @IsOptional()
  credit_score?: number;
}
