import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamTemplateService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all public exam templates with their items
   */
  async list() {
    return this.prisma.examTemplate.findMany({
      where: { isPublic: true },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get unique categories from public templates
   */
  async getCategories() {
    const templates = await this.prisma.examTemplate.findMany({
      where: { isPublic: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return templates.map((t) => t.category);
  }

  /**
   * Get a single template by ID with its items
   */
  async findOne(id: string) {
    const template = await this.prisma.examTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Exam template not found');
    }

    if (!template.isPublic) {
      throw new NotFoundException('Exam template not found');
    }

    return template;
  }
}
