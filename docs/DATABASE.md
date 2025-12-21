# Documentação do Banco de Dados

Este documento descreve a estrutura do banco de dados PostgreSQL utilizado pelo Study Planner.

## Visão Geral

O banco de dados é gerenciado pelo **Prisma ORM** e utiliza **PostgreSQL**. A estrutura suporta:

- Autenticação via OAuth (Google) usando Better Auth
- Registro de sessões de estudo
- Metas semanais personalizáveis
- Configurações do usuário
- Compartilhamento de planos entre usuários

## Diagrama de Relacionamentos

```
┌─────────────┐       ┌─────────────────┐
│    User     │───────│   UserConfig    │
│             │  1:1  │                 │
└──────┬──────┘       └─────────────────┘
       │
       │ 1:N
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Session   │ │   Account   │ │ WeeklyGoal  │ │StudySession │
│ (auth)      │ │ (OAuth)     │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

       │
       │ N:N (via SharedPlan)
       ▼
┌─────────────┐
│ SharedPlan  │
│             │
└─────────────┘
```

---

## Tabelas

### 1. `user`

Armazena informações dos usuários do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `email` | `String` | E-mail do usuário (único) |
| `email_verified` | `Boolean` | Se o e-mail foi verificado |
| `name` | `String?` | Nome do usuário |
| `image` | `String?` | URL da foto de perfil |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Data da última atualização |

**Relacionamentos:**
- `1:N` → `Session` (sessões de autenticação)
- `1:N` → `Account` (contas OAuth)
- `1:N` → `StudySession` (sessões de estudo)
- `1:N` → `WeeklyGoal` (metas semanais)
- `1:1` → `UserConfig` (configurações)
- `N:N` → `SharedPlan` (compartilhamentos)

---

### 2. `session`

Gerencia sessões de autenticação ativas (Better Auth).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `user_id` | `String` | ID do usuário (FK → user) |
| `token` | `String` | Token de sessão (único) |
| `expires_at` | `DateTime` | Data de expiração |
| `ip_address` | `String?` | Endereço IP do cliente |
| `user_agent` | `String?` | User-Agent do navegador |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Data da última atualização |

**Índices:** `user_id`

---

### 3. `account`

Armazena credenciais de provedores OAuth (Google, etc.).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `user_id` | `String` | ID do usuário (FK → user) |
| `account_id` | `String` | ID da conta no provedor |
| `provider_id` | `String` | Identificador do provedor (ex: "google") |
| `access_token` | `String?` | Token de acesso OAuth |
| `refresh_token` | `String?` | Token de refresh OAuth |
| `access_token_expires_at` | `DateTime?` | Expiração do access token |
| `refresh_token_expires_at` | `DateTime?` | Expiração do refresh token |
| `scope` | `String?` | Escopos autorizados |
| `id_token` | `String?` | ID Token (JWT) |
| `password` | `String?` | Hash da senha (se login local) |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Data da última atualização |

**Índices:** `user_id`

---

### 4. `verification`

Tokens de verificação (e-mail, reset de senha, etc.).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `identifier` | `String` | Identificador (e-mail, etc.) |
| `value` | `String` | Valor/token de verificação |
| `expires_at` | `DateTime` | Data de expiração |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Data da última atualização |

---

### 5. `user_configs`

Configurações personalizadas do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `user_id` | `String` | ID do usuário (FK → user, único) |
| `target_hours` | `Float` | Meta padrão de horas semanais (default: 30) |
| `week_start_day` | `Int` | Dia de início da semana (0=Dom, 1=Seg, ..., 6=Sáb) |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Data da última atualização |

**Constraint:** Um `UserConfig` por usuário (`user_id` é único)

---

### 6. `weekly_goals`

Metas semanais específicas por semana.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `user_id` | `String` | ID do usuário (FK → user) |
| `week_start` | `Date` | Data de início da semana (segunda-feira) |
| `target_hours` | `Float` | Meta de horas para esta semana |
| `is_custom` | `Boolean` | Se a meta foi personalizada pelo usuário |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Data da última atualização |

**Constraints:**
- Único: `(user_id, week_start)` - Uma meta por semana por usuário

**Índices:** `user_id`

**Comportamento:**
- Quando não existe meta para uma semana, o sistema usa `target_hours` de `user_configs`
- `is_custom = true` indica que o usuário alterou a meta manualmente

---

### 7. `study_sessions`

Registro de sessões de estudo.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `user_id` | `String` | ID do usuário (FK → user) |
| `date` | `Date` | Data da sessão de estudo |
| `subject` | `String` | Nome da matéria/disciplina |
| `minutes` | `Int` | Duração em minutos |
| `created_at` | `DateTime` | Data de criação |
| `updated_at` | `DateTime` | Data da última atualização |

**Índices:**
- `(user_id, date)` - Busca por sessões de um usuário em uma data
- `user_id` - Busca por todas as sessões de um usuário

**Exemplo de uso:**
```json
{
  "user_id": "abc123",
  "date": "2024-12-20",
  "subject": "Matemática",
  "minutes": 90
}
```

---

### 8. `shared_plans`

Compartilhamento de planos de estudo entre usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `String` (CUID) | Identificador único (PK) |
| `owner_id` | `String` | ID do dono do plano (FK → user) |
| `shared_with_id` | `String` | ID do usuário com acesso (FK → user) |
| `permission` | `Permission` | Nível de permissão (READ/WRITE) |
| `start_date` | `Date?` | Data inicial do compartilhamento |
| `end_date` | `Date?` | Data final do compartilhamento |
| `created_at` | `DateTime` | Data de criação |

**Enum `Permission`:**
- `READ` - Apenas visualização
- `WRITE` - Pode editar sessões

**Constraints:**
- Único: `(owner_id, shared_with_id)` - Um compartilhamento por par de usuários

**Índices:** `shared_with_id`

---

## Fluxos de Dados

### Registro de Sessão de Estudo

```
1. Usuário clica em um dia no calendário
2. Preenche: matéria + minutos
3. Frontend POST /api/study-sessions
4. Backend cria registro em `study_sessions`
5. Frontend atualiza visualização
```

### Cálculo de Progresso Semanal

```sql
-- Busca total de minutos da semana atual
SELECT SUM(minutes) as total_minutes
FROM study_sessions
WHERE user_id = ?
  AND date >= ? -- início da semana
  AND date <= ? -- fim da semana
```

### Meta Semanal

```
1. Busca WeeklyGoal para a semana específica
2. Se não existe:
   a. Busca UserConfig.target_hours
   b. Cria WeeklyGoal com is_custom = false
3. Retorna target_hours
```

---

## Migrações

O Prisma gerencia as migrações automaticamente. Comandos úteis:

```bash
# Gerar migration após alterar schema.prisma
npx prisma migrate dev --name <nome_da_migration>

# Aplicar migrations em produção
npx prisma migrate deploy

# Sincronizar schema sem migration (dev only)
npx prisma db push

# Visualizar banco no Prisma Studio
npx prisma studio
```

---

## Considerações de Performance

1. **Índices otimizados:**
   - `study_sessions(user_id, date)` para queries do calendário
   - `weekly_goals(user_id)` para busca de metas

2. **Cascade delete:**
   - Deletar um usuário remove automaticamente todos os dados relacionados

3. **Tipos de data:**
   - `@db.Date` usado para campos que não precisam de hora (study_sessions.date, weekly_goals.week_start)
   - Reduz armazenamento e evita problemas de timezone
