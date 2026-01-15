/**
 * Payments Service
 * 
 * Handles Stripe payment integration
 * Creates checkout sessions and processes payments
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    // Initialize Stripe with secret key from environment
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2024-12-18.acacia',
      },
    );
  }

  /**
   * Create Stripe Checkout Session
   * Returns checkout URL for payment
   */
  async createCheckoutSession(
    userId: string,
    createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    const { orderId } = createCheckoutSessionDto;

    // Get order details
    const order = await this.ordersService.findOne(orderId);

    // Verify order belongs to user
    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to user');
    }

    // Verify order is in PENDING status
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Order is already ${order.status}. Cannot create checkout session.`,
      );
    }

    try {
      // Create Stripe Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: order.product.name,
                description: order.product.description || '',
              },
              unit_amount: Math.round(Number(order.amount) * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/payment/cancel`,
        metadata: {
          orderId: order.id,
          userId: userId,
        },
      });

      // Update order with Stripe session ID
      await this.ordersService.updateStripeSession(orderId, session.id);

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create checkout session: ${error.message}`,
      );
    }
  }

  /**
   * Get Stripe webhook signing secret
   */
  getWebhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  /**
   * Get Stripe instance for webhook verification
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
