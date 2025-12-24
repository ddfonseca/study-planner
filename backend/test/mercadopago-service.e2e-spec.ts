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
    PreApprovalPlan: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
    })),
    PreApproval: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
    })),
  };
});

// Import after mocking
import { PreApprovalPlan, PreApproval } from 'mercadopago';

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;
  let mockPreApprovalPlan: jest.Mocked<{ create: jest.Mock }>;
  let mockPreApproval: jest.Mocked<{ create: jest.Mock; get: jest.Mock; update: jest.Mock }>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        MERCADOPAGO_ACCESS_TOKEN: 'TEST-fake-access-token',
        FRONTEND_URL: 'http://localhost:5173',
        MERCADOPAGO_WEBHOOK_SECRET: 'test-webhook-secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const prisma = jestPrisma.client;

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockPreApprovalPlan = {
      create: jest.fn(),
    };

    mockPreApproval = {
      create: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
    };

    // Configure the mock constructors to return our mock objects
    (PreApprovalPlan as jest.Mock).mockImplementation(() => mockPreApprovalPlan);
    (PreApproval as jest.Mock).mockImplementation(() => mockPreApproval);

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

  describe('createSubscription', () => {
    it('should create a subscription and return init_point', async () => {
      // Arrange
      const user = await createTestUser({ email: 'subscriber@test.com' });
      const plan = await createTestSubscriptionPlan({
        name: 'pro',
        displayName: 'Pro',
        priceMonthly: 19.90,
        priceYearly: 199.90,
      });

      mockPreApproval.create.mockResolvedValue({
        id: 'mp-subscription-123',
        init_point: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=123',
        status: 'pending',
      });

      // Act
      const result = await service.createSubscription({
        planId: plan.id,
        userId: user.id,
        userEmail: user.email,
        billingCycle: 'MONTHLY',
      });

      // Assert
      expect(result.initPoint).toBe('https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=123');
      expect(result.subscriptionId).toBe('mp-subscription-123');

      // Verify MP API was called correctly
      expect(mockPreApproval.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          reason: 'Pro - Mensal',
          payer_email: 'subscriber@test.com',
          auto_recurring: expect.objectContaining({
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 19.90,
            currency_id: 'BRL',
          }),
          back_url: 'http://localhost:5173/app/settings?subscription=success',
          status: 'pending',
        }),
      });

      // Verify database was updated
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      expect(subscription).not.toBeNull();
      expect(subscription?.planId).toBe(plan.id);
      expect(subscription?.externalId).toBe('mp-subscription-123');
      expect(subscription?.status).toBe('TRIALING');
    });

    it('should create yearly subscription with correct frequency', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan({
        name: 'pro-yearly',
        displayName: 'Pro Anual',
        priceMonthly: 19.90,
        priceYearly: 199.90,
      });

      mockPreApproval.create.mockResolvedValue({
        id: 'mp-yearly-123',
        init_point: 'https://mp.com/checkout',
        status: 'pending',
      });

      // Act
      await service.createSubscription({
        planId: plan.id,
        userId: user.id,
        userEmail: user.email,
        billingCycle: 'YEARLY',
      });

      // Assert
      expect(mockPreApproval.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          reason: 'Pro Anual - Anual',
          auto_recurring: expect.objectContaining({
            frequency: 12,
            transaction_amount: 199.90,
          }),
        }),
      });
    });

    it('should throw error for free plan', async () => {
      // Arrange
      const user = await createTestUser();
      const freePlan = await createTestSubscriptionPlan({
        name: 'free',
        displayName: 'Gratuito',
        priceMonthly: 0,
        priceYearly: 0,
      });

      // Act & Assert
      await expect(
        service.createSubscription({
          planId: freePlan.id,
          userId: user.id,
          userEmail: user.email,
          billingCycle: 'MONTHLY',
        }),
      ).rejects.toThrow('Cannot create subscription for free plan');
    });

    it('should throw error for non-existent plan', async () => {
      // Arrange
      const user = await createTestUser();

      // Act & Assert
      await expect(
        service.createSubscription({
          planId: 'non-existent-plan-id',
          userId: user.id,
          userEmail: user.email,
          billingCycle: 'MONTHLY',
        }),
      ).rejects.toThrow('Plan not found');
    });

    it('should update existing subscription if user already has one', async () => {
      // Arrange
      const user = await createTestUser();
      const oldPlan = await createTestSubscriptionPlan({ name: 'old-plan' });
      const newPlan = await createTestSubscriptionPlan({ name: 'new-plan', priceMonthly: 29.90 });

      await createTestSubscription(user.id, oldPlan.id, { externalId: 'old-mp-id' });

      mockPreApproval.create.mockResolvedValue({
        id: 'new-mp-id',
        init_point: 'https://mp.com/new',
        status: 'pending',
      });

      // Act
      await service.createSubscription({
        planId: newPlan.id,
        userId: user.id,
        userEmail: user.email,
        billingCycle: 'MONTHLY',
      });

      // Assert - should have updated, not created new
      const prisma = jestPrisma.client;
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id },
      });

      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].planId).toBe(newPlan.id);
      expect(subscriptions[0].externalId).toBe('new-mp-id');
    });
  });

  describe('processWebhook', () => {
    it('should update subscription status on webhook', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan();
      await createTestSubscription(user.id, plan.id, {
        externalId: 'mp-sub-webhook-test',
        status: 'TRIALING',
      });

      mockPreApproval.get.mockResolvedValue({
        id: 'mp-sub-webhook-test',
        status: 'authorized',
        date_created: '2024-12-24T10:00:00Z',
        next_payment_date: '2025-01-24T10:00:00Z',
      });

      // Act
      await service.processWebhook('subscription_preapproval', { id: 'mp-sub-webhook-test' });

      // Assert
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findFirst({
        where: { externalId: 'mp-sub-webhook-test' },
      });

      expect(subscription?.status).toBe('ACTIVE');
    });

    it('should handle cancelled status from webhook', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan();
      await createTestSubscription(user.id, plan.id, {
        externalId: 'mp-sub-cancel',
        status: 'ACTIVE',
      });

      mockPreApproval.get.mockResolvedValue({
        id: 'mp-sub-cancel',
        status: 'cancelled',
      });

      // Act
      await service.processWebhook('subscription_preapproval', { id: 'mp-sub-cancel' });

      // Assert
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findFirst({
        where: { externalId: 'mp-sub-cancel' },
      });

      expect(subscription?.status).toBe('CANCELED');
    });

    it('should handle paused status from webhook', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan();
      await createTestSubscription(user.id, plan.id, {
        externalId: 'mp-sub-pause',
        status: 'ACTIVE',
      });

      mockPreApproval.get.mockResolvedValue({
        id: 'mp-sub-pause',
        status: 'paused',
      });

      // Act
      await service.processWebhook('subscription_preapproval', { id: 'mp-sub-pause' });

      // Assert
      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findFirst({
        where: { externalId: 'mp-sub-pause' },
      });

      expect(subscription?.status).toBe('PAUSED');
    });

    it('should ignore webhook for unknown subscription', async () => {
      // Arrange
      mockPreApproval.get.mockResolvedValue({
        id: 'unknown-mp-id',
        status: 'authorized',
      });

      // Act & Assert - should not throw
      await expect(
        service.processWebhook('subscription_preapproval', { id: 'unknown-mp-id' }),
      ).resolves.not.toThrow();
    });

    it('should ignore non-subscription webhook types', async () => {
      // Act
      await service.processWebhook('payment', { id: 'some-payment-id' });

      // Assert - get should not have been called
      expect(mockPreApproval.get).not.toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription in MP and update database', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan();
      await createTestSubscription(user.id, plan.id, {
        externalId: 'mp-to-cancel',
        status: 'ACTIVE',
      });

      mockPreApproval.update.mockResolvedValue({
        id: 'mp-to-cancel',
        status: 'cancelled',
      });

      // Act
      await service.cancelSubscription(user.id);

      // Assert
      expect(mockPreApproval.update).toHaveBeenCalledWith({
        id: 'mp-to-cancel',
        body: { status: 'cancelled' },
      });

      const prisma = jestPrisma.client;
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      expect(subscription?.status).toBe('CANCELED');
      expect(subscription?.cancelAtPeriodEnd).toBe(true);
    });

    it('should throw error if user has no subscription', async () => {
      // Arrange
      const user = await createTestUser();

      // Act & Assert
      await expect(service.cancelSubscription(user.id)).rejects.toThrow(
        'No active subscription found',
      );
    });

    it('should throw error if subscription has no external ID', async () => {
      // Arrange
      const user = await createTestUser();
      const plan = await createTestSubscriptionPlan();
      await createTestSubscription(user.id, plan.id, {
        externalId: undefined, // No MP ID
        status: 'ACTIVE',
      });

      // Act & Assert
      await expect(service.cancelSubscription(user.id)).rejects.toThrow(
        'No active subscription found',
      );
    });
  });

  describe('syncPlansWithMercadoPago', () => {
    it('should sync plans that do not have MP ID yet', async () => {
      // Arrange
      const plan1 = await createTestSubscriptionPlan({
        name: 'plan-to-sync',
        displayName: 'Plan to Sync',
        priceMonthly: 29.90,
        mercadoPagoPlanId: undefined, // Not synced
      });

      // Plan already synced - should be skipped
      await createTestSubscriptionPlan({
        name: 'already-synced',
        displayName: 'Already Synced',
        priceMonthly: 49.90,
        mercadoPagoPlanId: 'existing-mp-plan-id',
      });

      // Free plan - should be skipped
      await createTestSubscriptionPlan({
        name: 'free-plan',
        displayName: 'Free',
        priceMonthly: 0,
      });

      mockPreApprovalPlan.create.mockResolvedValue({
        id: 'new-mp-plan-id',
        status: 'active',
      });

      // Act
      await service.syncPlansWithMercadoPago();

      // Assert - should only sync plan1
      expect(mockPreApprovalPlan.create).toHaveBeenCalledTimes(1);
      expect(mockPreApprovalPlan.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          reason: 'Plan to Sync - Mensal',
          auto_recurring: expect.objectContaining({
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 29.90,
          }),
        }),
      });

      // Verify database was updated
      const prisma = jestPrisma.client;
      const updatedPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: plan1.id },
      });

      expect(updatedPlan?.mercadoPagoPlanId).toBe('new-mp-plan-id');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      await createTestSubscriptionPlan({
        name: 'plan-will-fail',
        priceMonthly: 19.90,
      });

      mockPreApprovalPlan.create.mockRejectedValue(new Error('API Error'));

      // Act & Assert - should not throw, just log error
      await expect(service.syncPlansWithMercadoPago()).resolves.not.toThrow();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status from MP', async () => {
      // Arrange
      mockPreApproval.get.mockResolvedValue({
        id: 'mp-sub-status',
        status: 'authorized',
        payer_email: 'test@test.com',
      });

      // Act
      const result = await service.getSubscriptionStatus('mp-sub-status');

      // Assert
      expect(result).toEqual({
        id: 'mp-sub-status',
        status: 'authorized',
        payer_email: 'test@test.com',
      });
      expect(mockPreApproval.get).toHaveBeenCalledWith({ id: 'mp-sub-status' });
    });
  });
});
