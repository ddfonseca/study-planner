import { IsEnum, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  planId: string;

  @IsEnum(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';
}
