/**
 * Webhooks Controller
 * 
 * CRITICAL: Handles Stripe webhook events
 * This is the source of truth for payment status updates
 * Verifies webhook signature to ensure authenticity
 */
import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/enums/order-status.enum';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Stripe Webhook Endpoint
   * 
   * IMPORTANT: This endpoint must be publicly accessible
   * No authentication guard should be applied
   * Stripe signature verification provides security
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Req() req: Request) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      const stripe = this.paymentsService.getStripeInstance();
      const webhookSecret = this.paymentsService.getWebhookSecret();

      // Get raw body for signature verification
      const rawBody = req.body;

      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

      this.logger.log(`Received webhook event: ${event.type}`);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      this.logger.error(`Error processing webhook event: ${err.message}`);
      throw new BadRequestException(`Webhook processing error: ${err.message}`);
    }
  }

  /**
   * Handle successful checkout session completion
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    this.logger.log(`Processing checkout.session.completed: ${session.id}`);

    const orderId = session.metadata?.orderId;

    if (!orderId) {
      this.logger.error('No orderId in session metadata');
      return;
    }

    try {
      // Update order status to PAID
      const order = await this.ordersService.findByStripeSessionId(session.id);
      await this.ordersService.updateStatus(order.id, OrderStatus.PAID);

      this.logger.log(`Order ${orderId} marked as PAID`);
    } catch (error) {
      this.logger.error(`Failed to update order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`);

    // Additional logic if needed for payment intent success
    // This event fires after checkout.session.completed
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(`Processing payment_intent.payment_failed: ${paymentIntent.id}`);

    // Mark order as FAILED if payment fails
    // Note: You might need to track payment intent ID in your order
    this.logger.error(`Payment failed for payment intent: ${paymentIntent.id}`);
  }
}
