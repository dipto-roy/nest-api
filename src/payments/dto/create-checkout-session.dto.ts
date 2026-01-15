import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;
}
