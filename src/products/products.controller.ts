/**
 * Products Controller
 * 
 * Handles product-related endpoints
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a new product
   * Protected route - requires authentication
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Get all active products
   * Public route
   */
  @Get()
  async findAllActive() {
    return this.productsService.findAllActive();
  }

  /**
   * Get all products (including inactive)
   * Protected route - requires authentication
   */
  @Get('all')
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.productsService.findAll();
  }

  /**
   * Get product by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
