/**
 * Payments Controller
 * 
 * Handles payment-related endpoints
 */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create Stripe Checkout Session
   * Returns checkout URL for payment
   */
  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @Request() req,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    const userId = req.user.id;
    return this.paymentsService.createCheckoutSession(
      userId,
      createCheckoutSessionDto,
    );
  }
}
