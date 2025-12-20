import { Controller, Get, Put, Body } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ConfigService } from './config.service';
import { UpdateConfigDto } from './dto';

@Controller('api/config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  /**
   * GET /api/config
   * Retorna a configuração do usuário autenticado
   */
  @Get()
  async getConfig(@Session() session: UserSession) {
    const userId = session.user.id;
    return this.configService.findByUserId(userId);
  }

  /**
   * PUT /api/config
   * Atualiza a configuração do usuário autenticado
   */
  @Put()
  async updateConfig(
    @Session() session: UserSession,
    @Body() updateDto: UpdateConfigDto,
  ) {
    const userId = session.user.id;
    return this.configService.update(userId, updateDto);
  }
}
