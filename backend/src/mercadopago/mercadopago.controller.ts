/**
 * MercadoPago Controller - Endpoints for lifetime payment management
 */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { MercadoPagoService } from './mercadopago.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ConfigService } from '@nestjs/config';

@Controller('api/mercadopago')
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a lifetime payment
   * Returns the init_point URL to redirect the user to Mercado Pago checkout
   */
  @Post('subscribe')
  async createSubscription(
    @Session() session: UserSession,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const { planId } = dto;
    const userId = session.user.id;
    const userEmail = session.user.email;

    const result = await this.mercadoPagoService.createLifetimePayment({
      planId,
      userId,
      userEmail,
    });

    return {
      success: true,
      initPoint: result.initPoint,
      preferenceId: result.preferenceId,
    };
  }

  /**
   * Cancel the current subscription
   */
  @Post('cancel')
  async cancelSubscription(@Session() session: UserSession) {
    await this.mercadoPagoService.cancelSubscription(session.user.id);

    return {
      success: true,
      message: 'Assinatura cancelada com sucesso',
    };
  }

  /**
   * Webhook endpoint for Mercado Pago notifications
   * This is called by Mercado Pago when payment status changes
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: { type: string; data: { id: string } },
    @Headers('x-signature') signature: string,
  ) {
    this.logger.log(`Received webhook: ${body.type}`);

    // TODO: Validate webhook signature for security
    const webhookSecret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (webhookSecret) {
      this.logger.debug(`Webhook signature: ${signature}`);
    }

    try {
      await this.mercadoPagoService.processWebhook(body.type, body.data);
      return { success: true };
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      // Return 200 anyway to prevent retries for non-critical errors
      return { success: false, error: 'Processing failed' };
    }
  }
}
