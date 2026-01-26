import { Controller, Get, Param } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ExamTemplateService } from './exam-template.service';

@Controller('api/exam-templates')
export class ExamTemplateController {
  constructor(private examTemplateService: ExamTemplateService) {}

  /**
   * GET /api/exam-templates
   * List all public templates with items
   */
  @Get()
  async list(@Session() session: UserSession) {
    return this.examTemplateService.list();
  }

  /**
   * GET /api/exam-templates/categories
   * List unique categories
   */
  @Get('categories')
  async getCategories(@Session() session: UserSession) {
    return this.examTemplateService.getCategories();
  }

  /**
   * GET /api/exam-templates/:id
   * Get template with items
   */
  @Get(':id')
  async findOne(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.examTemplateService.findOne(id);
  }
}
