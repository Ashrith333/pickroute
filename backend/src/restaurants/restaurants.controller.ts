import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OnRouteDto } from './dto/restaurant.dto';
import {
  RestaurantRegistrationDto,
  UpdateRestaurantDto,
  UpdateOperatingHoursDto,
  UpdatePrepCapacityDto,
  Step5PrepCapacityDto,
  Step6BankDetailsDto,
} from './dto/restaurant-registration.dto';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // Public endpoints
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

  // Restaurant owner endpoints
  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async register(@Request() req, @Body() dto: RestaurantRegistrationDto) {
    return this.restaurantsService.registerRestaurant(req.user.id, dto);
  }

  @Get('owner/my-restaurant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async getMyRestaurant(@Request() req) {
    return this.restaurantsService.getRestaurantByOwner(req.user.id);
  }

  @Put('owner/my-restaurant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async updateMyRestaurant(@Request() req, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantsService.updateRestaurant(req.user.id, dto);
  }

  @Patch('owner/my-restaurant/operating-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async updateOperatingHours(@Request() req, @Body() dto: UpdateOperatingHoursDto) {
    return this.restaurantsService.updateOperatingHours(req.user.id, dto.operatingHours);
  }

  @Patch('owner/my-restaurant/prep-capacity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async updatePrepCapacity(@Request() req, @Body() dto: UpdatePrepCapacityDto) {
    return this.restaurantsService.updatePrepCapacity(req.user.id, dto);
  }

  @Post('owner/my-restaurant/bank-details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async updateBankDetails(@Request() req, @Body() dto: Step6BankDetailsDto) {
    return this.restaurantsService.updateBankDetails(req.user.id, dto);
  }

  @Post('owner/my-restaurant/submit-for-approval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async submitForApproval(@Request() req) {
    return this.restaurantsService.submitForApproval(req.user.id);
  }

  @Post('owner/my-restaurant/toggle-pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async togglePause(@Request() req) {
    return this.restaurantsService.togglePause(req.user.id);
  }

  // Menu management endpoints
  @Get('owner/my-restaurant/menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async getMyMenu(@Request() req) {
    const restaurant = await this.restaurantsService.getRestaurantByOwner(req.user.id);
    return this.restaurantsService.getMenuForOwner(restaurant.id);
  }

  @Post(':id/menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async createMenuItem(@Param('id') id: string, @Body() dto: any) {
    return this.restaurantsService.createMenuItem(id, dto);
  }

  @Put(':id/menu/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async updateMenuItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: any,
  ) {
    return this.restaurantsService.updateMenuItem(id, itemId, dto);
  }

  @Delete(':id/menu/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async deleteMenuItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.restaurantsService.deleteMenuItem(id, itemId);
  }

  @Patch(':id/menu/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT)
  async patchMenuItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: any,
  ) {
    return this.restaurantsService.updateMenuItem(id, itemId, dto);
  }
}

