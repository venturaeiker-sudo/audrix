import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string; // Will be uppercased automatically

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsDateString()
  opened_at: string;

  @IsDateString()
  @IsOptional()
  closed_at?: string;
}
