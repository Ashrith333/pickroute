import { IsNumber, IsString, IsOptional, IsArray } from 'class-validator';

export class OnRouteDto {
  @IsString()
  polyline: string;

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
  maxDetourKm?: number;

  @IsNumber()
  @IsOptional()
  maxWaitTimeMinutes?: number;

  @IsNumber()
  @IsOptional()
  arrivalEta?: number; // minutes

  @IsString()
  @IsOptional()
  transportMode?: string;

  @IsArray()
  @IsOptional()
  filters?: string[]; // ['ready_under_10', 'same_side', 'parking']
}

