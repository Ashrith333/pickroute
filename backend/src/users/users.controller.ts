import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Put('location')
  async updateLocation(
    @Request() req,
    @Body() body: { lat: number; lng: number },
  ) {
    return this.usersService.updateLocation(req.user.id, body.lat, body.lng);
  }
}

