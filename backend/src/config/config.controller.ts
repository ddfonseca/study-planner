import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ConfigService } from './config.service';
import { UpdateConfigDto } from './dto';

@Controller('api/config')
@UseGuards(AuthGuard)
export class ConfigController {
  constructor(private configService: ConfigService) {}

  /**
   * GET /api/config
   * Retorna a configuração do usuário autenticado
   */
  @Get()
  async getConfig(@Req() req: Request) {
    const userId = req['user'].id;
    return this.configService.findByUserId(userId);
  }

  /**
   * PUT /api/config
   * Atualiza a configuração do usuário autenticado
   */
  @Put()
  async updateConfig(@Req() req: Request, @Body() updateDto: UpdateConfigDto) {
    const userId = req['user'].id;
    return this.configService.update(userId, updateDto);
  }
}
