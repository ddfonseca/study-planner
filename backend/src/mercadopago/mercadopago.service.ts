/**
 * MercadoPago Service - Handles subscription integration with Mercado Pago
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';

interface CreateSubscriptionParams {
  planId: string; // Our internal plan ID
  userId: string;
  userEmail: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

interface MercadoPagoPlanData {
  reason: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'months' | 'years';
    transaction_amount: number;
    currency_id: string;
  };
  back_url: string;
  external_reference?: string;
}

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private preApprovalPlan: PreApprovalPlan;
  private preApproval: PreApproval;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.warn('MERCADOPAGO_ACCESS_TOKEN not configured');
      return;
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10000 },
    });

    this.preApprovalPlan = new PreApprovalPlan(this.client);
    this.preApproval = new PreApproval(this.client);

    this.logger.log('MercadoPago SDK initialized');
  }

  /**
   * Sync our database plans with Mercado Pago
   * Creates plans in MP if they don't have an external ID yet
   */
  async syncPlansWithMercadoPago(): Promise<void> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
        mercadoPagoPlanId: null, // Only plans not yet synced
        priceMonthly: { gt: 0 }, // Skip free plan
      },
    });

    const backUrlBase = this.configService.get<string>('MERCADOPAGO_BACK_URL')
      || this.configService.get<string>('FRONTEND_URL');

    for (const plan of plans) {
      try {
        // Create monthly plan
        const monthlyPlanData: MercadoPagoPlanData = {
          reason: `${plan.displayName} - Mensal`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: plan.priceMonthly,
            currency_id: 'BRL',
          },
          back_url: `${backUrlBase}/app/settings?subscription=success`,
          external_reference: `plan_${plan.id}_monthly`,
        };

        const mpPlan = await this.preApprovalPlan.create({ body: monthlyPlanData });

        await this.prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: { mercadoPagoPlanId: mpPlan.id },
        });

        this.logger.log(`Synced plan ${plan.name} with Mercado Pago: ${mpPlan.id}`);
      } catch (error) {
        this.logger.error(`Failed to sync plan ${plan.name}:`, error);
      }
    }
  }

  /**
   * Create a subscription for a user
   * Returns the init_point URL to redirect the user to Mercado Pago checkout
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<{ initPoint: string; subscriptionId: string }> {
    const { planId, userId, userEmail, billingCycle } = params;

    // Get the plan with its Mercado Pago ID
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.priceMonthly === 0 && plan.priceYearly === 0) {
      throw new Error('Cannot create subscription for free plan');
    }

    const backUrlBase = this.configService.get<string>('MERCADOPAGO_BACK_URL')
      || this.configService.get<string>('FRONTEND_URL')
      || 'http://localhost:5173';
    const amount = billingCycle === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;
    const frequency = billingCycle === 'YEARLY' ? 12 : 1;
    const frequencyType = 'months';
    const backUrl = `${backUrlBase}/app/settings?subscription=success`;

    this.logger.log(`Creating subscription with back_url: ${backUrl}`);

    // Create subscription directly (without pre-created plan)
    // Start date should be today or a future date
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() + 5); // Start 5 minutes from now

    const subscriptionData = {
      reason: `${plan.displayName} - ${billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'}`,
      external_reference: `user_${userId}_plan_${planId}`,
      payer_email: userEmail,
      auto_recurring: {
        frequency,
        frequency_type: frequencyType,
        transaction_amount: amount,
        currency_id: 'BRL',
        start_date: startDate.toISOString(),
      },
      back_url: backUrl,
      status: 'pending' as const,
    };

    this.logger.log(`Subscription data being sent: ${JSON.stringify(subscriptionData, null, 2)}`);

    const mpSubscription = await this.preApproval.create({ body: subscriptionData });

    this.logger.log(`Mercado Pago response: ${JSON.stringify(mpSubscription, null, 2)}`);

    // Save pending subscription in our database
    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: 'TRIALING', // Will be updated by webhook
        billingCycle,
        externalId: mpSubscription.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      update: {
        planId,
        status: 'TRIALING',
        billingCycle,
        externalId: mpSubscription.id,
      },
    });

    this.logger.log(`Created subscription for user ${userId}: ${mpSubscription.id}`);

    return {
      initPoint: mpSubscription.init_point!,
      subscriptionId: mpSubscription.id!,
    };
  }

  /**
   * Process webhook notification from Mercado Pago
   */
  async processWebhook(type: string, data: { id: string }): Promise<void> {
    this.logger.log(`Processing webhook: ${type} - ${data.id}`);

    if (type === 'subscription_preapproval') {
      await this.handleSubscriptionUpdate(data.id);
    }
  }

  /**
   * Handle subscription status update from webhook
   */
  private async handleSubscriptionUpdate(mpSubscriptionId: string): Promise<void> {
    try {
      // Get subscription details from Mercado Pago
      const mpSubscription = await this.preApproval.get({ id: mpSubscriptionId });

      // Find our subscription by MP ID
      const subscription = await this.prisma.subscription.findFirst({
        where: { externalId: mpSubscriptionId },
      });

      if (!subscription) {
        this.logger.warn(`Subscription not found for MP ID: ${mpSubscriptionId}`);
        return;
      }

      // Map MP status to our status
      const statusMap: Record<string, 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'PAUSED'> = {
        authorized: 'ACTIVE',
        paused: 'PAUSED',
        cancelled: 'CANCELED',
        pending: 'PAST_DUE',
      };

      const newStatus = statusMap[mpSubscription.status || ''] || 'PAST_DUE';

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: newStatus,
          currentPeriodStart: mpSubscription.date_created ? new Date(mpSubscription.date_created) : undefined,
          currentPeriodEnd: mpSubscription.next_payment_date ? new Date(mpSubscription.next_payment_date) : undefined,
        },
      });

      this.logger.log(`Updated subscription ${subscription.id} status to ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to handle subscription update:`, error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.externalId) {
      throw new Error('No active subscription found');
    }

    // Cancel in Mercado Pago
    await this.preApproval.update({
      id: subscription.externalId,
      body: { status: 'cancelled' },
    });

    // Update our database
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      },
    });

    this.logger.log(`Cancelled subscription for user ${userId}`);
  }

  /**
   * Get subscription status from Mercado Pago
   */
  async getSubscriptionStatus(mpSubscriptionId: string): Promise<unknown> {
    return this.preApproval.get({ id: mpSubscriptionId });
  }
}
