import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXAM_TEMPLATES = [
  {
    name: 'TRF - Analista Judiciário (Área Administrativa)',
    category: 'Tribunais',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Constitucional', weight: 1.5, medianLevel: 8 },
      { subject: 'Direito Administrativo', weight: 1.5, medianLevel: 8 },
      { subject: 'Direito Processual Civil', weight: 1.0, medianLevel: 7 },
      { subject: 'Administração Geral', weight: 1.0, medianLevel: 6 },
      { subject: 'Noções de Direito Penal', weight: 0.5, medianLevel: 6 },
      { subject: 'Raciocínio Lógico', weight: 0.8, medianLevel: 7 },
      { subject: 'Informática', weight: 0.5, medianLevel: 6 },
    ],
  },
  {
    name: 'TRF - Técnico Judiciário',
    category: 'Tribunais',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Constitucional', weight: 1.2, medianLevel: 7 },
      { subject: 'Direito Administrativo', weight: 1.2, medianLevel: 7 },
      { subject: 'Raciocínio Lógico', weight: 0.8, medianLevel: 6 },
      { subject: 'Informática', weight: 0.6, medianLevel: 6 },
      { subject: 'Noções de Direito Processual', weight: 0.8, medianLevel: 6 },
    ],
  },
  {
    name: 'Receita Federal - Auditor Fiscal',
    category: 'Receita Federal',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 8 },
      { subject: 'Direito Tributário', weight: 2.0, medianLevel: 9 },
      { subject: 'Contabilidade Geral', weight: 2.0, medianLevel: 8 },
      { subject: 'Auditoria', weight: 1.5, medianLevel: 7 },
      { subject: 'Direito Constitucional', weight: 1.0, medianLevel: 8 },
      { subject: 'Direito Administrativo', weight: 1.0, medianLevel: 8 },
      { subject: 'Legislação Tributária', weight: 1.5, medianLevel: 8 },
      { subject: 'Comércio Internacional', weight: 1.0, medianLevel: 7 },
      { subject: 'Raciocínio Lógico', weight: 0.8, medianLevel: 7 },
    ],
  },
  {
    name: 'Receita Federal - Analista Tributário',
    category: 'Receita Federal',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Tributário', weight: 1.5, medianLevel: 8 },
      { subject: 'Contabilidade Geral', weight: 1.5, medianLevel: 7 },
      { subject: 'Direito Constitucional', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Administrativo', weight: 1.0, medianLevel: 7 },
      { subject: 'Raciocínio Lógico', weight: 0.8, medianLevel: 7 },
      { subject: 'Informática', weight: 0.5, medianLevel: 6 },
    ],
  },
  {
    name: 'INSS - Técnico do Seguro Social',
    category: 'INSS',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Constitucional', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Administrativo', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Previdenciário', weight: 1.5, medianLevel: 8 },
      { subject: 'Raciocínio Lógico', weight: 0.8, medianLevel: 6 },
      { subject: 'Informática', weight: 0.5, medianLevel: 6 },
      { subject: 'Ética no Serviço Público', weight: 0.5, medianLevel: 6 },
    ],
  },
  {
    name: 'Polícia Federal - Agente',
    category: 'Polícia Federal',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 7 },
      { subject: 'Direito Constitucional', weight: 1.2, medianLevel: 8 },
      { subject: 'Direito Administrativo', weight: 1.2, medianLevel: 8 },
      { subject: 'Direito Penal', weight: 1.5, medianLevel: 8 },
      { subject: 'Direito Processual Penal', weight: 1.5, medianLevel: 8 },
      { subject: 'Legislação Especial', weight: 1.0, medianLevel: 7 },
      { subject: 'Raciocínio Lógico', weight: 0.8, medianLevel: 7 },
      { subject: 'Informática', weight: 0.5, medianLevel: 6 },
      { subject: 'Contabilidade', weight: 0.8, medianLevel: 6 },
    ],
  },
  {
    name: 'Polícia Federal - Delegado',
    category: 'Polícia Federal',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 8 },
      { subject: 'Direito Constitucional', weight: 1.5, medianLevel: 9 },
      { subject: 'Direito Administrativo', weight: 1.5, medianLevel: 9 },
      { subject: 'Direito Penal', weight: 2.0, medianLevel: 9 },
      { subject: 'Direito Processual Penal', weight: 2.0, medianLevel: 9 },
      { subject: 'Legislação Especial', weight: 1.2, medianLevel: 8 },
      { subject: 'Raciocínio Lógico', weight: 0.8, medianLevel: 8 },
      { subject: 'Direitos Humanos', weight: 0.8, medianLevel: 7 },
    ],
  },
  {
    name: 'Banco do Brasil - Escriturário',
    category: 'Bancos',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 7 },
      { subject: 'Matemática e Raciocínio Lógico', weight: 1.2, medianLevel: 7 },
      { subject: 'Atualidades do Mercado Financeiro', weight: 1.0, medianLevel: 7 },
      { subject: 'Conhecimentos Bancários', weight: 1.5, medianLevel: 8 },
      { subject: 'Informática', weight: 0.8, medianLevel: 7 },
      { subject: 'Vendas e Negociação', weight: 1.0, medianLevel: 7 },
    ],
  },
  {
    name: 'Caixa Econômica Federal - Técnico Bancário',
    category: 'Bancos',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 7 },
      { subject: 'Matemática Financeira', weight: 1.2, medianLevel: 7 },
      { subject: 'Conhecimentos Bancários', weight: 1.5, medianLevel: 8 },
      { subject: 'Informática', weight: 0.8, medianLevel: 7 },
      { subject: 'Atendimento', weight: 0.8, medianLevel: 7 },
      { subject: 'Ética e Legislação', weight: 0.5, medianLevel: 6 },
    ],
  },
  {
    name: 'CGU - Auditor Federal de Finanças e Controle',
    category: 'Controle',
    items: [
      { subject: 'Língua Portuguesa', weight: 1.0, medianLevel: 8 },
      { subject: 'Direito Constitucional', weight: 1.2, medianLevel: 8 },
      { subject: 'Direito Administrativo', weight: 1.2, medianLevel: 8 },
      { subject: 'Contabilidade', weight: 2.0, medianLevel: 9 },
      { subject: 'Auditoria Governamental', weight: 2.0, medianLevel: 8 },
      { subject: 'Administração Pública', weight: 1.0, medianLevel: 7 },
      { subject: 'Economia', weight: 1.0, medianLevel: 7 },
      { subject: 'AFO e Finanças Públicas', weight: 1.5, medianLevel: 8 },
    ],
  },
];

export async function seedExamTemplates() {
  console.log('🌱 Seeding exam templates...\n');

  for (const template of EXAM_TEMPLATES) {
    const existing = await prisma.examTemplate.findFirst({
      where: {
        name: template.name,
        category: template.category,
      },
    });

    if (existing) {
      console.log(`   📦 Template "${template.name}" already exists, skipping...`);
      continue;
    }

    await prisma.examTemplate.create({
      data: {
        name: template.name,
        category: template.category,
        isPublic: true,
        items: {
          create: template.items.map((item, index) => ({
            subject: item.subject,
            weight: item.weight,
            medianLevel: item.medianLevel,
            position: index,
          })),
        },
      },
    });

    console.log(`   ✅ Created template: ${template.name} (${template.items.length} items)`);
  }

  console.log('\n✅ Exam templates seeding complete!');
}

// If running directly
if (require.main === module) {
  seedExamTemplates()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
