/**
 * MercadoPago Service - Handles lifetime payment integration with Mercado Pago
 * Uses Preference API for one-time payments (not recurring subscriptions)
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';

interface CreateLifetimePaymentParams {
  planId: string;
  userId: string;
  userEmail: string;
}

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private preference: Preference;
  private payment: Payment;

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

    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);

    this.logger.log('MercadoPago SDK initialized');
  }

  /**
   * Create a lifetime payment preference
   * Returns the init_point URL to redirect the user to Mercado Pago checkout
   */
  async createLifetimePayment(params: CreateLifetimePaymentParams): Promise<{ initPoint: string; preferenceId: string }> {
    const { planId, userId, userEmail } = params;

    // Get the plan
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    const price = plan.priceLifetime ?? plan.priceMonthly;

    if (!price || price === 0) {
      throw new Error('Cannot create payment for free plan');
    }

    const backUrlBase = this.configService.get<string>('MERCADOPAGO_BACK_URL')
      || this.configService.get<string>('FRONTEND_URL')
      || 'http://localhost:5173';

    const preferenceData = {
      items: [
        {
          id: planId,
          title: `${plan.displayName} - Acesso Vitalício`,
          description: plan.description || 'Acesso vitalício a todos os recursos Premium',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price,
        },
      ],
      payer: {
        email: userEmail,
      },
      external_reference: `lifetime_${userId}_${planId}`,
      back_urls: {
        success: `${backUrlBase}/app/settings?subscription=success`,
        failure: `${backUrlBase}/app/settings?subscription=failure`,
        pending: `${backUrlBase}/app/settings?subscription=pending`,
      },
      auto_return: 'approved' as const,
      notification_url: this.configService.get<string>('MERCADOPAGO_WEBHOOK_URL'),
    };

    this.logger.log(`Creating lifetime payment preference: ${JSON.stringify(preferenceData, null, 2)}`);

    const mpPreference = await this.preference.create({ body: preferenceData });

    this.logger.log(`Mercado Pago preference response: ${JSON.stringify(mpPreference, null, 2)}`);

    // Save pending subscription in our database
    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: 'TRIALING', // Will be updated by webhook when payment is approved
        billingCycle: 'LIFETIME',
        externalId: mpPreference.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date('9999-12-31'), // Never expires
      },
      update: {
        planId,
        status: 'TRIALING',
        billingCycle: 'LIFETIME',
        externalId: mpPreference.id,
        currentPeriodEnd: new Date('9999-12-31'),
      },
    });

    this.logger.log(`Created lifetime payment preference for user ${userId}: ${mpPreference.id}`);

    return {
      initPoint: mpPreference.init_point!,
      preferenceId: mpPreference.id!,
    };
  }

  /**
   * Process webhook notification from Mercado Pago
   */
  async processWebhook(type: string, data: { id: string }): Promise<void> {
    this.logger.log(`Processing webhook: ${type} - ${data.id}`);

    if (type === 'payment') {
      await this.handlePaymentUpdate(data.id);
    }
  }

  /**
   * Handle payment status update from webhook
   */
  private async handlePaymentUpdate(paymentId: string): Promise<void> {
    try {
      // Get payment details from Mercado Pago
      const mpPayment = await this.payment.get({ id: paymentId });

      this.logger.log(`Payment details: ${JSON.stringify(mpPayment, null, 2)}`);

      const externalReference = mpPayment.external_reference;

      if (!externalReference?.startsWith('lifetime_')) {
        this.logger.warn(`Invalid external_reference format: ${externalReference}`);
        return;
      }

      // Parse external_reference: "lifetime_{userId}_{planId}"
      const parts = externalReference.split('_');
      if (parts.length !== 3) {
        this.logger.warn(`Cannot parse external_reference: ${externalReference}`);
        return;
      }

      const userId = parts[1];
      const planId = parts[2];

      if (mpPayment.status === 'approved') {
        // Payment approved - activate lifetime subscription
        await this.prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            planId,
            status: 'ACTIVE',
            billingCycle: 'LIFETIME',
            externalId: paymentId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date('9999-12-31'),
          },
          update: {
            status: 'ACTIVE',
            billingCycle: 'LIFETIME',
            externalId: paymentId,
            currentPeriodEnd: new Date('9999-12-31'),
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
        });

        // Record the payment
        const subscription = await this.prisma.subscription.findUnique({
          where: { userId },
        });

        if (subscription) {
          await this.prisma.payment.create({
            data: {
              subscriptionId: subscription.id,
              amount: mpPayment.transaction_amount || 0,
              currency: mpPayment.currency_id || 'BRL',
              status: 'COMPLETED',
              externalId: paymentId,
              paidAt: new Date(),
            },
          });
        }

        this.logger.log(`Activated lifetime subscription for user ${userId}`);
      } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
        // Payment failed - update subscription status
        await this.prisma.subscription.updateMany({
          where: { userId, externalId: paymentId },
          data: { status: 'CANCELED' },
        });

        this.logger.log(`Payment failed for user ${userId}: ${mpPayment.status}`);
      } else if (mpPayment.status === 'refunded') {
        // Refund processed - revert user to free plan
        await this.handleRefund(userId, paymentId, mpPayment.transaction_amount || 0);
        this.logger.log(`Refund processed for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle payment update:`, error);
      throw error;
    }
  }

  /**
   * Handle refund - revert user to free plan
   */
  private async handleRefund(userId: string, paymentId: string, refundAmount: number): Promise<void> {
    // Find the free plan
    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: { name: 'free' },
    });

    if (!freePlan) {
      this.logger.error('Free plan not found in database');
      throw new Error('Free plan not configured');
    }

    // Revert subscription to free plan
    await this.prisma.subscription.updateMany({
      where: { userId },
      data: {
        planId: freePlan.id,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        externalId: null,
        currentPeriodEnd: new Date('9999-12-31'),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    // Record the refund in payment history
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription) {
      await this.prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: -refundAmount, // Negative amount indicates refund
          currency: 'BRL',
          status: 'REFUNDED',
          externalId: `refund_${paymentId}`,
          paidAt: new Date(),
        },
      });
    }

    this.logger.log(`User ${userId} reverted to free plan after refund`);
  }

  /**
   * Cancel a subscription (for lifetime, just marks as canceled in our DB)
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // For lifetime subscriptions, we just mark as canceled in our database
    // (there's no recurring payment to cancel in MP)
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    this.logger.log(`Cancelled subscription for user ${userId}`);
  }

  /**
   * Get payment status from Mercado Pago
   */
  async getPaymentStatus(paymentId: string): Promise<unknown> {
    return this.payment.get({ id: paymentId });
  }
}
