import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  identification_type?: string; // cedula, pasaporte, rnc

  @IsString()
  @IsOptional()
  identification_number?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  status?: string; // defaults to "active"

  @IsString()
  @IsOptional()
  assigned_to?: string; // User ID

  @IsString()
  @IsOptional()
  branch_id?: string;

  @IsInt()
  @Min(0)
  @Max(1000)
  @IsOptional()
  credit_score?: number;
}
