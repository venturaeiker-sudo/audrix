import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenCashSessionDto {
  @IsString()
  @IsNotEmpty()
  branch_id: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  opening_amount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
