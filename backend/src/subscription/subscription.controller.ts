import { Controller, Get, Post, Body } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { SubscriptionService } from './subscription.service';

@Controller('api/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Get all available plans (public)
   */
  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  /**
   * Get current user's subscription
   */
  @Get('current')
  async getCurrentSubscription(@Session() session: UserSession) {
    const subscription = await this.subscriptionService.getUserSubscription(
      session.user.id,
    );

    if (!subscription) {
      const freePlan = await this.subscriptionService.getFreePlan();
      return {
        plan: freePlan,
        subscription: null,
        isFree: true,
      };
    }

    return {
      plan: (subscription as any).plan,
      subscription,
      isFree: false,
    };
  }

  /**
   * Get current user's limits
   */
  @Get('limits')
  async getLimits(@Session() session: UserSession) {
    return this.subscriptionService.getUserLimits(session.user.id);
  }

  /**
   * Check a specific feature limit
   */
  @Post('check-limit')
  async checkLimit(
    @Session() session: UserSession,
    @Body() body: { feature: string; currentUsage: number },
  ) {
    return this.subscriptionService.checkFeatureLimit(
      session.user.id,
      body.feature,
      body.currentUsage,
    );
  }

  /**
   * Cancel subscription (for future use with Mercado Pago)
   */
  @Post('cancel')
  async cancelSubscription(
    @Session() session: UserSession,
    @Body() body: { immediate?: boolean },
  ) {
    const result = await this.subscriptionService.cancelSubscription(
      session.user.id,
      body.immediate,
    );

    if (!result) {
      return { message: 'No active subscription found' };
    }

    return {
      message: body.immediate
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at period end',
      subscription: result,
    };
  }

  // Future: Mercado Pago checkout endpoint
  // @Post('checkout')
  // async createCheckout(@Session() session: UserSession, @Body() body: { planId: string; billingCycle: string }) {
  //   // Will integrate with Mercado Pago SDK
  // }

  // Future: Mercado Pago webhook
  // @Post('webhook')
  // async handleWebhook(@Body() body: any, @Headers() headers: any) {
  //   // Will handle Mercado Pago payment notifications
  // }
}
