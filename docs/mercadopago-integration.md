# Integração Mercado Pago

Este documento descreve a integração completa do sistema de pagamentos com o Mercado Pago.

## Visão Geral

O sistema utiliza a **API de Preferências (Preference)** do Mercado Pago para pagamentos únicos vitalícios. O fluxo principal consiste em:

1. Usuário seleciona o plano Pro no frontend
2. Backend cria uma preferência de pagamento no Mercado Pago
3. Usuário é redirecionado para checkout do Mercado Pago
4. Mercado Pago notifica o status do pagamento via webhook
5. Sistema ativa a assinatura vitalícia no banco

---

## Banco de Dados

### Modelo de Dados (Prisma)

```
┌─────────────────────┐     ┌─────────────────────┐
│  SubscriptionPlan   │     │      PlanLimit      │
├─────────────────────┤     ├─────────────────────┤
│ id                  │◄────│ planId              │
│ name (unique)       │     │ feature             │
│ displayName         │     │ limitValue          │
│ description         │     └─────────────────────┘
│ priceMonthly        │
│ priceYearly         │     ┌─────────────────────┐
│ priceLifetime       │     │    Subscription     │
│ isActive            │◄────├─────────────────────┤
└─────────────────────┘     │ id                  │
                            │ userId (unique)     │
                            │ planId              │
┌─────────────────────┐     │ status              │
│       Payment       │     │ billingCycle        │ ← LIFETIME
├─────────────────────┤     │ currentPeriodStart  │
│ id                  │     │ currentPeriodEnd    │ ← 9999-12-31
│ subscriptionId      │◄────│ cancelAtPeriodEnd   │
│ amount              │     │ externalId          │ ← ID do pagamento no MP
│ currency            │     │ externalCustomerId  │
│ status              │     └─────────────────────┘
│ externalId          │ ← ID do pagamento no MP
└─────────────────────┘
```

### Tabelas

#### `subscription_plans`
Armazena os planos disponíveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | String | ID único (CUID) |
| `name` | String | Identificador único do plano (`free`, `pro`) |
| `display_name` | String | Nome exibido na UI |
| `description` | String? | Descrição do plano |
| `price_monthly` | Float | Preço mensal (legado, não usado) |
| `price_yearly` | Float | Preço anual (legado, não usado) |
| `price_lifetime` | Float? | Preço do pagamento único vitalício |
| `is_active` | Boolean | Se o plano está disponível |
| `mercadopago_plan_id` | String? | Deprecado (era para assinaturas recorrentes) |

#### `plan_limits`
Define os limites de cada feature por plano.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | String | ID único |
| `plan_id` | String | FK para subscription_plans |
| `feature` | String | Nome da feature |
| `limit_value` | Int | Valor do limite (-1 = ilimitado, 0 = desabilitado) |

**Features disponíveis:**
- `max_cycles` - Máximo de ciclos de estudo
- `max_workspaces` - Máximo de workspaces
- `max_sessions_per_day` - Sessões por dia
- `export_data` - Exportar dados (0/1)
- `shared_plans` - Planos compartilhados
- `history_days` - Dias de histórico

#### `subscriptions`
Assinaturas dos usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | String | ID único |
| `user_id` | String | FK para users (único - 1 assinatura por usuário) |
| `plan_id` | String | FK para subscription_plans |
| `status` | Enum | Status da assinatura |
| `billing_cycle` | Enum | `LIFETIME` (ou legados: `MONTHLY`, `YEARLY`) |
| `current_period_start` | DateTime | Data de início (data do pagamento) |
| `current_period_end` | DateTime | `9999-12-31` para vitalício (nunca expira) |
| `cancel_at_period_end` | Boolean | Se foi cancelado |
| `external_id` | String? | ID do pagamento no Mercado Pago |

**Status possíveis:**
- `ACTIVE` - Assinatura ativa (pagamento aprovado)
- `TRIALING` - Aguardando pagamento
- `CANCELED` - Cancelada
- `PAST_DUE` - Legado (não usado no modelo vitalício)
- `PAUSED` - Legado (não usado no modelo vitalício)

#### `payments`
Histórico de pagamentos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | String | ID único |
| `subscription_id` | String | FK para subscriptions |
| `amount` | Float | Valor do pagamento |
| `currency` | String | Moeda (BRL) |
| `status` | Enum | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` |
| `external_id` | String? | ID do pagamento no Mercado Pago |
| `paid_at` | DateTime? | Data do pagamento |

---

## Backend

### Estrutura de Arquivos

```
backend/src/
├── mercadopago/
│   ├── mercadopago.module.ts      # Módulo NestJS
│   ├── mercadopago.controller.ts  # Endpoints da API
│   ├── mercadopago.service.ts     # Lógica de integração
│   └── dto/
│       └── create-subscription.dto.ts
└── subscription/
    ├── subscription.module.ts
    ├── subscription.controller.ts  # Endpoints de planos/limites
    └── subscription.service.ts     # Lógica de assinaturas
```

### Variáveis de Ambiente

```bash
# Credenciais do Mercado Pago (obter em https://www.mercadopago.com.br/developers)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx  # ou APP-xxxx para produção

# URLs de redirecionamento
MERCADOPAGO_BACK_URL=http://localhost:5173  # URL base para redirecionamento após checkout
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/mercadopago/webhook  # URL do webhook

# Opcional (para validação futura)
MERCADOPAGO_WEBHOOK_SECRET=xxxx
```

### API Endpoints

#### POST `/api/mercadopago/subscribe`
Cria uma preferência de pagamento e retorna URL de checkout.

**Headers:** Requer sessão autenticada (cookie)

**Request:**
```json
{
  "planId": "clxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "initPoint": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=xxx",
  "preferenceId": "xxx"
}
```

**Fluxo:**
1. Valida que o plano existe e tem `priceLifetime` > 0
2. Cria preferência de pagamento no Mercado Pago (Preference API)
3. Salva assinatura no banco com status `TRIALING` e `billingCycle: LIFETIME`
4. Retorna `initPoint` para redirecionamento

#### POST `/api/mercadopago/cancel`
Cancela a assinatura do usuário.

**Headers:** Requer sessão autenticada (cookie)

**Response:**
```json
{
  "success": true,
  "message": "Assinatura cancelada com sucesso"
}
```

**Nota:** Para pagamentos vitalícios, o cancelamento apenas marca como cancelado no banco (não há cobrança recorrente para cancelar no MP).

#### POST `/api/mercadopago/webhook`
Recebe notificações do Mercado Pago.

**Request (do Mercado Pago):**
```json
{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET `/api/subscription/plans`
Lista todos os planos ativos.

#### GET `/api/subscription/current`
Retorna assinatura atual do usuário.

#### GET `/api/subscription/limits`
Retorna limites de features do usuário.

#### POST `/api/subscription/check-limit`
Verifica se usuário pode usar uma feature.

---

## Webhook

### Configuração no Mercado Pago

1. Acesse [Developers > Webhooks](https://www.mercadopago.com.br/developers/panel/app)
2. Adicione a URL: `https://seu-dominio.com/api/mercadopago/webhook`
3. Selecione os eventos: `payment`
4. Copie o `Webhook Secret` para a variável de ambiente (para validação futura)

### Tipos de Eventos Processados

| Tipo | Descrição |
|------|-----------|
| `payment` | Mudança de status do pagamento |

### Mapeamento de Status

| Status Mercado Pago | Status App | Ação |
|---------------------|------------|------|
| `approved` | `ACTIVE` | Ativa assinatura vitalícia |
| `rejected` | `CANCELED` | Marca como cancelada |
| `cancelled` | `CANCELED` | Marca como cancelada |

### Fluxo do Webhook

```
Mercado Pago                    Backend
     │                             │
     ├──POST /webhook──────────────►│
     │  { type: "payment",         │
     │    data: { id } }           │
     │                             ├─── Identifica tipo = payment
     │                             │
     │                             ├─── Busca detalhes no MP
     │                             │    GET /v1/payments/{id}
     │                             │
     │                             ├─── Extrai external_reference
     │                             │    "lifetime_{userId}_{planId}"
     │                             │
     │                             ├─── Se approved:
     │                             │    - Atualiza status = ACTIVE
     │                             │    - Registra pagamento
     │                             │
     │◄─────── 200 OK ─────────────┤
     │                             │
```

---

## Frontend

### Estrutura de Arquivos

```
frontend/src/
├── lib/api/
│   └── subscription.ts           # Cliente API
├── store/
│   └── subscriptionStore.ts      # Estado global (Zustand)
├── hooks/
│   └── useSubscriptionLimits.ts  # Hooks de limites
└── components/subscription/
    ├── PricingModal.tsx          # Modal de planos
    ├── UpgradePrompt.tsx         # Componente de upgrade
    └── LimitIndicator.tsx        # Indicador de uso
```

### API Client

```typescript
// frontend/src/lib/api/subscription.ts

subscriptionApi.subscribe(planId)
// → { success, initPoint, preferenceId }

subscriptionApi.cancelMercadoPago()
// → { success, message }

subscriptionApi.getPlans()
// → SubscriptionPlan[]

subscriptionApi.getCurrent()
// → { plan, subscription, isFree }

subscriptionApi.getLimits()
// → { plan, limits }

subscriptionApi.checkLimit(feature, currentUsage)
// → { allowed, limit, current, remaining }
```

### Tipos TypeScript

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  priceLifetime: number | null;
  isActive: boolean;
  limits: PlanLimit[];
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'PAUSED';
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}
```

### Constantes de Features

```typescript
export const FEATURES = {
  MAX_CYCLES: 'max_cycles',
  MAX_WORKSPACES: 'max_workspaces',
  MAX_SESSIONS_PER_DAY: 'max_sessions_per_day',
  EXPORT_DATA: 'export_data',
  SHARED_PLANS: 'shared_plans',
  HISTORY_DAYS: 'history_days',
}
```

---

## Fluxos de Uso

### Criar Pagamento Vitalício

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Frontend  │     │  Backend   │     │ Mercado    │     │  Frontend  │
│  (Modal)   │     │            │     │ Pago       │     │ (Settings) │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      │                  │                  │                  │
      │ POST /subscribe  │                  │                  │
      │ { planId }       │                  │                  │
      ├─────────────────►│                  │                  │
      │                  │ POST /preference │                  │
      │                  ├─────────────────►│                  │
      │                  │◄─────────────────┤                  │
      │                  │ { init_point }   │                  │
      │◄─────────────────┤                  │                  │
      │ { initPoint }    │                  │                  │
      │                  │                  │                  │
      │ redirect ────────┼──────────────────►                  │
      │                  │                  │ (checkout)       │
      │                  │                  │                  │
      │                  │                  │ redirect ───────►│
      │                  │                  │ ?subscription=   │
      │                  │                  │   success        │
      │                  │                  │                  │
      │                  │ POST /webhook    │                  │
      │                  │ type: payment    │                  │
      │                  │◄─────────────────┤                  │
      │                  │ status: approved │                  │
      │                  │                  │                  │
      │                  ├── update DB ─────┤                  │
      │                  │   ACTIVE         │                  │
      │                  │   LIFETIME       │                  │
```

### Cancelar Assinatura

```
┌────────────┐     ┌────────────┐
│  Frontend  │     │  Backend   │
│ (Settings) │     │            │
└─────┬──────┘     └─────┬──────┘
      │                  │
      │ POST /cancel     │
      ├─────────────────►│
      │                  │
      │                  ├── update DB
      │                  │   status: CANCELED
      │                  │   canceledAt: now()
      │◄─────────────────┤
      │  { success }     │
```

---

## Planos Configurados

| Plano | Preço Vitalício | Ciclos | Workspaces | Sessões/dia | Exportar | Histórico |
|-------|-----------------|--------|------------|-------------|----------|-----------|
| Free | R$ 0 | 1 | 2 | 20 | Não | 30 dias |
| Pro | R$ 19,90 | 10 | 10 | Ilimitado | Sim | 365 dias |

> **Nota:** O plano Pro é um pagamento único que concede acesso vitalício a todos os recursos premium.

---

## Testes

Os testes E2E estão em `backend/test/mercadopago-service.e2e-spec.ts`:

```bash
# Executar testes
npm run test:e2e -- --testPathPattern=mercadopago
```

**Cobertura:**
- Criação de preferência de pagamento vitalício
- Processamento de webhooks (approved, rejected)
- Cancelamento de assinaturas
- Tratamento de erros (plano gratuito, plano inexistente)
- Upsert de assinaturas existentes

---

## Considerações de Segurança

### Pendentes (TODO)
1. **Validação de assinatura do webhook** - Verificar header `x-signature` com `MERCADOPAGO_WEBHOOK_SECRET`

### Implementados
- Autenticação via sessão/JWT em todos os endpoints (exceto webhook)
- Validação de DTOs com class-validator
- External reference com formato `lifetime_{userId}_{planId}` para rastrear pagamentos
- Retorno 200 no webhook mesmo em caso de erro (evita retries desnecessários)

---

## Referências

- [Documentação Mercado Pago - Preferências](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integrate-preferences)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
