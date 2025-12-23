import {
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class PreviewRouteDto {
  @IsNumber()
  fromLat: number;

  @IsNumber()
  fromLng: number;

  @IsNumber()
  toLat: number;

  @IsNumber()
  toLng: number;

  @IsNumber()
  @IsOptional()
  viaLat?: number;

  @IsNumber()
  @IsOptional()
  viaLng?: number;

  @IsString()
  @IsOptional()
  transportMode?: string; // 'bike' | 'car'

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  maxDetourKm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(60)
  maxWaitTimeMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  arrivalFlexibilityMinutes?: number;

  @IsDateString()
  @IsOptional()
  scheduledStartTime?: string;
}

