# Testes do Backend

Este documento explica a estrutura e funcionamento dos testes do backend do projeto Study Planner.

## Tecnologias Utilizadas

- **Jest** (v30.0.0) - Framework de testes
- **ts-jest** (v29.2.5) - Transformador TypeScript para Jest
- **@nestjs/testing** (v11.0.1) - Utilitários de teste do NestJS

## Estrutura de Arquivos

```
backend/
├── test/
│   ├── jest-e2e.json               # Configuração Jest para testes E2E
│   ├── setup.ts                    # Setup global dos testes E2E
│   ├── helpers/
│   │   └── database.helper.ts      # Utilitários de banco de dados
│   └── *.e2e-spec.ts               # Testes end-to-end
└── package.json                    # Configuração Jest
```

## Testes E2E

Localizados na pasta `test/`. Testam a lógica de negócio através dos **serviços**.

| Arquivo | Descrição |
|---------|-----------|
| `weekly-goal-service.e2e-spec.ts` | Testes do WeeklyGoalService |
| `sessions-weekly-goal.e2e-spec.ts` | Testes de integração Sessions + WeeklyGoal |

## Banco de Dados de Teste

Os testes utilizam um banco PostgreSQL separado (porta 5433) para não interferir no desenvolvimento.

```
URL: postgresql://test:test@localhost:5433/study_planner_test?schema=public
```

## Padrões de Teste

### Testando Serviços (não Prisma diretamente)

Os testes focam na **lógica de negócio** através dos serviços, não em operações Prisma:

```typescript
// Correto: testa através do serviço
const sessions = await studySessionsService.findByDateRange(
  user.id,
  '2024-12-16',
  '2024-12-22',
);
const totalMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0);

// Evitar: testar Prisma diretamente
const sessions = await prisma.studySession.findMany({ ... });
```

### Isolamento de Testes

Cada teste limpa o banco antes de executar:

```typescript
beforeEach(async () => {
  await cleanDatabase();
});
```

### Mocking de Dependências

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    StudySessionsService,
    WeeklyGoalService,
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
