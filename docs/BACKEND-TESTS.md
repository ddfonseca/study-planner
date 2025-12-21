# Testes do Backend

Este documento explica a estrutura e funcionamento dos testes do backend do projeto Study Planner.

## Tecnologias Utilizadas

- **Jest** (v30.0.0) - Framework de testes
- **ts-jest** (v29.2.5) - Transformador TypeScript para Jest
- **Supertest** (v7.0.0) - Testes de requisições HTTP
- **@nestjs/testing** (v11.0.1) - Utilitários de teste do NestJS

## Estrutura de Arquivos

```
backend/
├── src/
│   └── *.spec.ts          # Testes unitários (junto ao código)
├── test/
│   ├── jest-e2e.json      # Configuração Jest para testes E2E
│   ├── setup.ts           # Setup global dos testes E2E
│   ├── helpers/
│   │   └── database.helper.ts  # Utilitários de banco de dados
│   └── *.e2e-spec.ts      # Testes end-to-end
└── package.json           # Configuração Jest para testes unitários
```

## Tipos de Testes
### 1. Testes E2E (`*.e2e-spec.ts`)

Localizados na pasta `test/`. Testam a aplicação de ponta a ponta.

**Categorias de testes E2E disponíveis:**

| Arquivo | Descrição |
|---------|-----------|
| `weekly-goal.e2e-spec.ts` | Testes do modelo WeeklyGoal (Prisma) |
| `weekly-goal-service.e2e-spec.ts` | Testes do WeeklyGoalService |
| `weekly-goal-controller.e2e-spec.ts` | Testes do WeeklyGoalController (HTTP) |
| `sessions-weekly-goal.e2e-spec.ts` | Testes de integração Sessions + WeeklyGoal |

## Banco de Dados de Teste

Os testes E2E utilizam um banco de dados PostgreSQL separado para não interferir no desenvolvimento.

**Configuração:**
```
URL: postgresql://test:test@localhost:5433/study_planner_test?schema=public
```

### Setup Global (test/setup.ts)

```typescript
import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5433/study_planner_test?schema=public';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

## Padrões de Teste

### Isolamento de Testes

Cada teste limpa o banco antes de executar usando `cleanDatabase()`:

```typescript
beforeEach(async () => {
  await cleanDatabase();
});
```

### Mocking de Serviços

Os testes utilizam mocks para isolar componentes:

```typescript
class MockPrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: 'postgresql://test:test@localhost:5433/study_planner_test?schema=public',
        },
      },
    });
  }
}

const module: TestingModule = await Test.createTestingModule({
  providers: [
    WeeklyGoalService,
    { provide: PrismaService, useValue: prisma },
    {
      provide: ConfigService,
      useValue: {
        findByUserId: jest.fn().mockResolvedValue({ targetHours: 30 }),
      },
    },
  ],
}).compile();
```

### Testes de Controller (HTTP)

Os controllers usam `@Session() session: UserSession` do Better Auth para obter o usuário autenticado.
Para testes, é necessário mockar a sessão do Better Auth.

Utilizam Supertest para fazer requisições HTTP:

```typescript
const response = await request(app.getHttpServer())
  .get('/api/weekly-goals/2024-12-16')
  .expect(200);

expect(response.body.targetHours).toBe(30);
```

**Nota:** Os testes de controller precisam mockar o decorator `@Session` do `@thallesp/nestjs-better-auth` para simular um usuário autenticado.

### Testes de Model (Prisma)

Testam operações diretas no banco de dados:

```typescript
const weeklyGoal = await prisma.weeklyGoal.create({
  data: {
    userId: user.id,
    weekStart: new Date('2024-12-16'),
    targetHours: 30,
    isCustom: false,
  },
});

expect(weeklyGoal.targetHours).toBe(30);
```

## Dicas

- Use datas UTC (`Date.UTC()`) para evitar problemas de fuso horário
- Mantenha testes independentes - não dependam da ordem de execução
- Use `jest.fn().mockResolvedValue()` para mocks assíncronos
- O timeout padrão dos testes E2E é 30 segundos
