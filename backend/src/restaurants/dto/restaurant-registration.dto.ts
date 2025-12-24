import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  IsEmail,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class OperatingHoursDto {
  @IsString()
  @IsOptional()
  open?: string;

  @IsString()
  @IsOptional()
  close?: string;

  @IsOptional()
  breaks?: { start: string; end: string }[];
}

export class Step1AccountDto {
  @IsString()
  legalName: string;

  @IsString()
  displayName: string;

  @IsString()
  phone: string; // Already verified via OTP

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @IsString()
  primaryContactName: string;
}

export class Step2LocationDto {
  @IsString()
  address: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsString()
  @IsOptional()
  entryPickupPoint?: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsBoolean()
  parkingAvailable: boolean;
}

export class Step3OperatingHoursDto {
  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  monday: OperatingHoursDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  tuesday: OperatingHoursDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  wednesday: OperatingHoursDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  thursday: OperatingHoursDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  friday: OperatingHoursDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  saturday: OperatingHoursDto;

  @IsObject()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  sunday: OperatingHoursDto;
}

export class Step4MenuDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  category: string;

  @IsNumber()
  @Min(0)
  prepTimeMinutes: number;

  @IsBoolean()
  isVeg: boolean;

  @IsBoolean()
  @IsOptional()
  isFastPickup?: boolean;
}

export class Step5PrepCapacityDto {
  @IsNumber()
  @Min(1)
  @Max(120)
  defaultPrepTimeMinutes: number;

  @IsNumber()
  @Min(1)
  @Max(50)
  maxOrdersPer15Min: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  maxOrdersPer30Min: number;

  @IsNumber()
  @Min(0)
  @Max(60)
  holdTimeAfterReadyMinutes: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  peakHourBufferMinutes: number;

  @IsBoolean()
  autoAcceptOrders: boolean;
}

export class Step6BankDetailsDto {
  @IsString()
  bankAccountNumber: string;

  @IsString()
  bankIfscCode: string;

  @IsString()
  bankAccountName: string;
}

export class RestaurantRegistrationDto {
  @ValidateNested()
  @Type(() => Step1AccountDto)
  account: Step1AccountDto;

  @ValidateNested()
  @Type(() => Step2LocationDto)
  location: Step2LocationDto;

  @ValidateNested()
  @Type(() => Step3OperatingHoursDto)
  operatingHours: Step3OperatingHoursDto;

  @IsString()
  @IsOptional()
  pickupInstructions?: string;
}

export class UpdateRestaurantDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  primaryContactName?: string;

  @IsBoolean()
  @IsOptional()
  acceptsOrders?: boolean;

  @IsString()
  @IsOptional()
  pickupInstructions?: string;
}

export class UpdateOperatingHoursDto {
  @IsObject()
  operatingHours: Record<string, OperatingHoursDto>;
}

export class UpdatePrepCapacityDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(120)
  defaultPrepTimeMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  maxOrdersPer15Min?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxOrdersPer30Min?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(60)
  holdTimeAfterReadyMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  peakHourBufferMinutes?: number;

  @IsBoolean()
  @IsOptional()
  autoAcceptOrders?: boolean;
}

