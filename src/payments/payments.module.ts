import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentRedirectController } from './payment-redirect.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, PaymentRedirectController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
