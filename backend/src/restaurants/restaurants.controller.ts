import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnRouteDto } from './dto/restaurant.dto';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post('on-route')
  @UseGuards(JwtAuthGuard)
  async findOnRoute(@Request() req, @Body() dto: OnRouteDto) {
    return this.restaurantsService.findOnRoute(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Get(':id/menu')
  async getMenu(@Param('id') id: string) {
    return this.restaurantsService.getMenu(id);
  }

  @Get()
  async findAll(@Query('nearby') nearby?: string) {
    if (nearby) {
      const [lat, lng] = nearby.split(',').map(Number);
      return this.restaurantsService.findNearby(lat, lng, 5); // 5km radius
    }
    return this.restaurantsService.findAll();
  }
}

