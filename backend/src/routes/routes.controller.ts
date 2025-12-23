import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PreviewRouteDto } from './dto/route.dto';

@Controller('routes')
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post('preview')
  async previewRoute(@Request() req, @Body() dto: PreviewRouteDto) {
    return this.routesService.previewRoute(req.user.id, dto);
  }

  @Get()
  async getUserRoutes(@Request() req) {
    return this.routesService.getUserRoutes(req.user.id);
  }

  @Get(':id')
  async getRoute(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }
}

