import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitiatePaymentDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(@Request() req, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(req.user.id, dto);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}

