# Testes do Backend

Este documento explica a estrutura e funcionamento dos testes do backend do projeto Study Planner.

## Tecnologias Utilizadas

- **Jest** (v30.0.0) - Framework de testes
- **ts-jest** (v29.2.5) - Transformador TypeScript para Jest
- **@nestjs/testing** (v11.0.1) - Utilitários de teste do NestJS
- **@quramy/jest-prisma** - Isolamento de testes via transaction rollback

## Estrutura de Arquivos

```
backend/
├── test/
│   ├── jest-e2e.json               # Configuração Jest para testes E2E
│   ├── helpers/
│   │   └── database.helper.ts      # Utilitários de banco de dados
│   └── *.e2e-spec.ts               # Testes end-to-end
└── package.json                    # Configuração Jest
```

## Testes E2E

Localizados na pasta `test/`. Testam a lógica de negócio através dos **serviços**.

| Arquivo | Descrição |
|---------|-----------|
| `weekly-goal-service.e2e-spec.ts` | Testes do WeeklyGoalService (20 testes) |
| `study-sessions-service.e2e-spec.ts` | Testes do StudySessionsService (18 testes) |
| `config-service.e2e-spec.ts` | Testes do ConfigService (6 testes) |
| `sessions-weekly-goal.e2e-spec.ts` | Testes de integração (5 testes) |

## Banco de Dados de Teste

Os testes utilizam um banco PostgreSQL separado (porta 5433) para não interferir no desenvolvimento.

```
URL: postgresql://test:test@localhost:5433/study_planner_test?schema=public
```

## Padrões de Teste

### Isolamento via Transaction Rollback

Usamos `@quramy/jest-prisma` para isolar cada teste. Cada `it()` roda dentro de uma transação que é automaticamente revertida ao final:

```typescript
describe('MyService', () => {
  beforeEach(async () => {
    const prisma = jestPrisma.client; // Cliente dentro da transação
    // ... setup do módulo
  });

  it('test 1', async () => {
    // Cria dados → testa → rollback automático
  });

  it('test 2', async () => {
    // Banco limpo! Cada teste é independente
  });
});
```

**Benefícios:**
- Testes podem rodar em **paralelo** (cada um tem sua transação)
- Não precisa de `cleanDatabase()` manual
- Mais rápido que deletar dados

### Testando Serviços

Os testes focam na **lógica de negócio** através dos serviços:

```typescript
// Correto: testa através do serviço
const sessions = await studySessionsService.findByDateRange(
  user.id,
  '2024-12-16',
  '2024-12-22',
);
```

### Setup do Módulo

```typescript
beforeEach(async () => {
  const prisma = jestPrisma.client;

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      StudySessionsService,
      { provide: PrismaService, useValue: prisma },
      {
        provide: ConfigService,
        useValue: {
          findByUserId: jest.fn().mockResolvedValue({
            targetHours: 30,
            weekStartDay: 1,
          }),
        },
      },
    ],
  }).compile();

  service = module.get<StudySessionsService>(StudySessionsService);
});
```

## Comandos

| Comando | Descrição |
|---------|-----------|
| `make test` | Sobe container, roda testes E2E, derruba container |
| `make test-db` | Apenas sobe o container de teste |
| `make test-reset` | Recria o banco de teste do zero |

## Dicas

- Use datas UTC (`Date.UTC()`) para evitar problemas de fuso horário
- Mantenha testes independentes - não dependam da ordem de execução
- Use `jest.fn().mockResolvedValue()` para mocks assíncronos
- O timeout padrão dos testes E2E é 30 segundos
