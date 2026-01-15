/**
 * Orders Service
 * 
 * Handles order creation and management
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Create a new order with PENDING status
   */
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const { productId } = createOrderDto;

    // Verify product exists and is active
    const product = await this.productsService.findOne(productId);

    if (!product.isActive) {
      throw new NotFoundException('Product is not available');
    }

    // Create order with PENDING status
    const order = this.orderRepository.create({
      userId,
      productId,
      amount: product.price,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }

  /**
   * Update order with Stripe session ID
   */
  async updateStripeSession(
    orderId: string,
    stripeSessionId: string,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    order.stripeSessionId = stripeSessionId;
    return this.orderRepository.save(order);
  }

  /**
   * Update order status (called by webhook)
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(orderId);
    order.status = status;
    return this.orderRepository.save(order);
  }

  /**
   * Find order by Stripe session ID
   */
  async findByStripeSessionId(stripeSessionId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { stripeSessionId },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with Stripe session ID ${stripeSessionId} not found`,
      );
    }

    return order;
  }

  /**
   * Get order by ID
   */
  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Get all orders for a user
   */
  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
