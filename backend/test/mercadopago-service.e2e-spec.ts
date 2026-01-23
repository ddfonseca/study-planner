/**
 * MercadoPagoService E2E Tests
 * Mocks the Mercado Pago SDK while using real database
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from '../src/mercadopago/mercadopago.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestUser,
  createTestSubscriptionPlan,
  createTestSubscription,
} from './helpers/database.helper';

// Mock the mercadopago SDK
jest.mock('mercadopago', () => {
  return {
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Preference: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
    })),
    Payment: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
    })),
  };
});

// Import after mocking
import { Preference, Payment } from 'mercadopago';

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;
  let mockPreference: jest.Mocked<{ create: jest.Mock }>;
  let mockPayment: jest.Mocked<{ get: jest.Mock }>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        MERCADOPAGO_ACCESS_TOKEN: 'TEST-fake-access-token',
        FRONTEND_URL: 'http://localhost:5173',
        MERCADOPAGO_WEBHOOK_SECRET: 'test-webhook-secret',
        MERCADOPAGO_WEBHOOK_URL: 'http://localhost:3000/api/mercadopago/webhook',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const prisma = jestPrisma.client;

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockPreference = {
      create: jest.fn(),
    };

    mockPayment = {
      get: jest.fn(),
    };

    // Configure the mock constructors to return our mock objects
    (Preference as jest.Mock).mockImplementation(() => mockPreference);
    (Payment as jest.Mock).mockImplementation(() => mockPayment);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);

    // Trigger onModuleInit to initialize SDK
    service.onModuleInit();
  });

  describe('createLifetimePayment', () => {
    it('should create a preference and return init_point', async () => {
      // Arrange
      const user = await createTestUser({ email: 'buyer@test.com' });
      const plan = await createTestSubscriptionPlan({
        name: 'pro',
        displayName: 'Pro',
        priceLifetime: 19.90,
      });

      mockPreference.create.mockResolvedValue({
        id: 'preference-123',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      });

      // Act
      const result = await service.createLifetimePayment({
        planId: plan.id,
        userId: user.id,
        userEmail: user.email,
      });

      // Assert
      expect(result.initPoint).toBe('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123');
      expect(result.preferenceId).toBe('preference-123');

      // Verify MP API was called correctly
      expect(mockPreference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          items: [
            expect.objectContaining({
              id: plan.id,
              title: 'Pro - Acesso Vitalício',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: 19.90,
            }),
          ],
          payer: { email: 'buyer@test.com' },
          external_reference: `lifetime_${user.id}_${plan.id}`,
          back_urls: {
            success: 'http://localhost:5173/app/settings?subscription=success',
            failure: 'http://localhost:5173/app/settings?subscription=failure',
            pending: 'http://localhost:5173/app/settings?subscription=pending',
          },
          auto_return: 'approved',
        }),
      });

      // Verify database was updated
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      expect(subscription).not.toBeNull();
      expect(subscription?.planId).toBe(plan.id);
      expect(subscription?.externalId).toBe('preference-123');
      expect(subscription?.status).toBe('TRIALING');
      expect(subscription?.billingCycle).toBe('LIFETIME');
    });

    it('should throw error for free plan', async () => {
      // Arrange
      const user = await createTestUser();
      const freePlan = await createTestSubscriptionPlan({
        name: 'free',
        displayName: 'Gratuito',
        priceLifetime: 0,
      });

      // Act & Assert
      await expect(
        service.createLifetimePayment({
          planId: freePlan.id,
          userId: user.id,
          userEmail: user.email,
        }),
      ).rejects.toThrow('Cannot create payment for free plan');
    });

    it('should throw error for non-existent plan', async () => {
      // Arrange
      const user = await createTestUser();

      // Act & Assert
      await expect(
        service.createLifetimePayment({
          planId: 'non-existent-plan-id',
          userId: user.id,
          userEmail: user.email,
        }),
      ).rejects.toThrow('Plan not found');
    });

    it('should update existing subscription if user already has one', async () => {
      // Arrange
      const user = await createTestUser();
      const oldPlan = await createTestSubscriptionPlan({ name: 'old-plan' });
      const newPlan = await createTestSubscriptionPlan({ name: 'new-plan', priceLifetime: 29.90 });

      await createTestSubscription(user.id, oldPlan.id, { externalId: 'old-pref-id' });

      mockPreference.create.mockResolvedValue({
        id: 'new-pref-id',
        init_point: 'https://mp.com/new',
      });

      // Act
      await service.createLifetimePayment({
        planId: newPlan.id,
        userId: user.id,
        userEmail: user.email,
      });

      // Assert - should have updated, not created new
      const prisma = jestPrisma.client;
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id },
      });

      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].planId).toBe(newPlan.id);
      expect(subscriptions[0].externalId).toBe('new-pref-id');
      expect(subscriptions[0].billingCycle).toBe('LIFETIME');
    });
  });

  describe('processWebhook - payment', () => {
    it('should activate subscription when payment is approved', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan({ priceLifetime: 19.90 });
      await createTestSubscription(user.id, plan.id, {
        externalId: 'preference-id',
        status: 'TRIALING',
        billingCycle: 'LIFETIME',
      });

      mockPayment.get.mockResolvedValue({
        id: 'payment-123',
        status: 'approved',
        external_reference: `lifetime_${user.id}_${plan.id}`,
        transaction_amount: 19.90,
        currency_id: 'BRL',
      });

      // Act
      await service.processWebhook('payment', { id: 'payment-123' });

      // Assert
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      expect(subscription?.status).toBe('ACTIVE');
      expect(subscription?.billingCycle).toBe('LIFETIME');
      expect(subscription?.externalId).toBe('payment-123');

      // Check payment was recorded
      const payments = await prisma.payment.findMany({
        where: { subscriptionId: subscription!.id },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(19.90);
      expect(payments[0].status).toBe('COMPLETED');
    });

    it('should handle rejected payment', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan();
      await createTestSubscription(user.id, plan.id, {
        externalId: 'preference-id',
        status: 'TRIALING',
        billingCycle: 'LIFETIME',
      });

      mockPayment.get.mockResolvedValue({
        id: 'payment-rejected',
        status: 'rejected',
        external_reference: `lifetime_${user.id}_${plan.id}`,
      });

      // Act
      await service.processWebhook('payment', { id: 'payment-rejected' });

      // Assert
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });

      // Status should still be TRIALING since we only update on exact match
      expect(subscription?.status).toBe('TRIALING');
    });

    it('should ignore payments with invalid external_reference', async () => {
      // Arrange
      mockPayment.get.mockResolvedValue({
        id: 'payment-other',
        status: 'approved',
        external_reference: 'some_other_reference',
      });

      // Act & Assert - should not throw
      await expect(
        service.processWebhook('payment', { id: 'payment-other' }),
      ).resolves.not.toThrow();
    });

    it('should ignore non-payment webhook types', async () => {
      // Act
      await service.processWebhook('subscription_preapproval', { id: 'some-id' });

      // Assert - get should not have been called
      expect(mockPayment.get).not.toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('should mark subscription as canceled in database', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan();
      await createTestSubscription(user.id, plan.id, {
        externalId: 'payment-id',
        status: 'ACTIVE',
        billingCycle: 'LIFETIME',
      });

      // Act
      await service.cancelSubscription(user.id);

      // Assert
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      expect(subscription?.status).toBe('CANCELED');
      expect(subscription?.cancelAtPeriodEnd).toBe(true);
      expect(subscription?.canceledAt).not.toBeNull();
    });

    it('should throw error if user has no subscription', async () => {
      // Arrange
      const user = await createTestUser();

      // Act & Assert
      await expect(service.cancelSubscription(user.id)).rejects.toThrow(
        'No active subscription found',
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status from MP', async () => {
      // Arrange
      mockPayment.get.mockResolvedValue({
        id: 'payment-status-test',
        status: 'approved',
        transaction_amount: 19.90,
      });

      // Act
      const result = await service.getPaymentStatus('payment-status-test');

      // Assert
      expect(result).toEqual({
        id: 'payment-status-test',
        status: 'approved',
        transaction_amount: 19.90,
      });
      expect(mockPayment.get).toHaveBeenCalledWith({ id: 'payment-status-test' });
    });
  });
});
