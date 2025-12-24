import { IsString, IsNotEmpty, IsOptional, Length, IsIn, IsBoolean } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phone: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  otp: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class SetRoleDto {
  @IsString()
  @IsIn(['user', 'restaurant'])
  role: 'user' | 'restaurant';

  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean;
}

