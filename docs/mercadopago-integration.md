# Integração Mercado Pago

Este documento descreve a integração completa do sistema de assinaturas com o Mercado Pago.

## Visão Geral

O sistema utiliza a **API de Assinaturas (PreApproval)** do Mercado Pago para gerenciar planos de assinatura recorrente. O fluxo principal consiste em:

1. Usuário seleciona um plano no frontend
2. Backend cria uma assinatura no Mercado Pago
3. Usuário é redirecionado para checkout do Mercado Pago
4. Mercado Pago notifica mudanças de status via webhook
5. Sistema atualiza o status da assinatura no banco

---

## Banco de Dados

### Modelo de Dados (Prisma)

```
┌─────────────────────┐     ┌─────────────────────┐
│  SubscriptionPlan   │     │      PlanLimit      │
├─────────────────────┤     ├─────────────────────┤
│ id                  │◄────│ planId              │
│ name (unique)       │     │ featureName         │
│ displayName         │     │ limitValue          │
│ description         │     └─────────────────────┘
│ priceMonthly        │
│ priceYearly         │     ┌─────────────────────┐
│ isActive            │     │    Subscription     │
│ mercadoPagoPlanId   │◄────├─────────────────────┤
└─────────────────────┘     │ id                  │
                            │ userId (unique)     │
                            │ planId              │
┌─────────────────────┐     │ status              │
│       Payment       │     │ billingCycle        │
├─────────────────────┤     │ currentPeriodStart  │
│ id                  │     │ currentPeriodEnd    │
│ subscriptionId      │◄────│ cancelAtPeriodEnd   │
│ amount              │     │ externalId          │ ← ID da assinatura no MP
│ currency            │     │ externalCustomerId  │ ← ID do cliente no MP
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
| `name` | String | Identificador único do plano (`free`, `pro`, `pro_annual`) |
| `display_name` | String | Nome exibido na UI |
| `description` | String? | Descrição do plano |
| `price_monthly` | Float | Preço mensal em BRL |
| `price_yearly` | Float | Preço anual em BRL |
| `is_active` | Boolean | Se o plano está disponível |
| `mercadopago_plan_id` | String? | ID do PreApprovalPlan no Mercado Pago |

#### `plan_limits`
Define os limites de cada feature por plano.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | String | ID único |
| `plan_id` | String | FK para subscription_plans |
| `feature_name` | String | Nome da feature |
| `limit_value` | Int | Valor do limite (-1 = ilimitado, 0 = desabilitado) |

**Features disponíveis:**
- `max_cycles` - Máximo de ciclos de estudo
- `max_workspaces` - Máximo de workspaces
- `max_sessions_per_day` - Sessões por dia
- `export_data` - Exportar dados (0/1)
- `shared_plans` - Planos compartilhados
- `history_days` - Dias de histórico

#### `subscriptions`
Assinaturas ativas dos usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | String | ID único |
| `user_id` | String | FK para users (único - 1 assinatura por usuário) |
| `plan_id` | String | FK para subscription_plans |
| `status` | Enum | Status da assinatura |
| `billing_cycle` | Enum | `MONTHLY` ou `YEARLY` |
| `current_period_start` | DateTime | Início do período atual |
| `current_period_end` | DateTime | Fim do período atual |
| `cancel_at_period_end` | Boolean | Cancelar ao fim do período |
| `external_id` | String? | ID da assinatura no Mercado Pago |
| `external_customer_id` | String? | ID do cliente no Mercado Pago |

**Status possíveis:**
- `ACTIVE` - Assinatura ativa
- `TRIALING` - Em período de trial/processamento
- `PAST_DUE` - Pagamento pendente
- `PAUSED` - Pausada
- `CANCELED` - Cancelada

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
MERCADOPAGO_PUBLIC_KEY=TEST-xxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxx

# URL do frontend (para redirecionamento após checkout)
FRONTEND_URL=http://localhost:5173
```

### API Endpoints

#### POST `/api/mercadopago/subscribe`
Cria uma assinatura e retorna URL de checkout.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "planId": "clxxxxxx",
  "billingCycle": "MONTHLY"  // ou "YEARLY"
}
```

**Response:**
```json
{
  "success": true,
  "initPoint": "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=xxx",
  "subscriptionId": "clxxxxxx"
}
```

**Fluxo:**
1. Valida que o plano existe e tem preço > 0
2. Cria assinatura no Mercado Pago via PreApproval API
3. Salva assinatura no banco com status `TRIALING`
4. Retorna `initPoint` para redirecionamento

#### POST `/api/mercadopago/cancel`
Cancela a assinatura ativa do usuário.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Assinatura cancelada com sucesso"
}
```

#### POST `/api/mercadopago/webhook`
Recebe notificações do Mercado Pago.

**Request (do Mercado Pago):**
```json
{
  "type": "subscription_preapproval",
  "data": {
    "id": "2c938084726fca480172750000000000"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST `/api/mercadopago/sync-plans`
Sincroniza planos com o Mercado Pago (admin).

**Response:**
```json
{
  "success": true,
  "message": "Planos sincronizados com sucesso"
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
3. Selecione os eventos: `subscription_preapproval`
4. Copie o `Webhook Secret` para a variável de ambiente

### Tipos de Eventos Processados

| Tipo | Descrição |
|------|-----------|
| `subscription_preapproval` | Mudança de status da assinatura |

### Mapeamento de Status

| Status Mercado Pago | Status App |
|---------------------|------------|
| `authorized` | `ACTIVE` |
| `pending` | `PAST_DUE` |
| `paused` | `PAUSED` |
| `cancelled` | `CANCELED` |

### Fluxo do Webhook

```
Mercado Pago                    Backend
     │                             │
     ├──POST /webhook──────────────►│
     │  { type, data.id }          │
     │                             ├─── Identifica tipo
     │                             │
     │                             ├─── Busca detalhes no MP
     │                             │    GET /preapproval/{id}
     │                             │
     │                             ├─── Mapeia status
     │                             │
     │                             ├─── Atualiza banco
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

subscriptionApi.subscribe(planId, billingCycle)
// → { success, initPoint, subscriptionId }

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

### Store (Zustand)

```typescript
// frontend/src/store/subscriptionStore.ts

const useSubscriptionStore = create((set, get) => ({
  currentPlan: null,
  subscription: null,
  limits: {},
  plans: [],
  isFree: true,

  fetchCurrentSubscription: async () => { ... },
  fetchPlans: async () => { ... },
  fetchLimits: async () => { ... },
  getLimit: (feature) => { ... },
  canUseFeature: (feature, usage) => { ... },
}))
```

### Hooks de Limites

```typescript
// frontend/src/hooks/useSubscriptionLimits.ts

// Verificar se pode usar feature
const { canUse, limit, remaining } = useCanUseFeature('max_cycles', currentCount)

// Obter limite de uma feature
const limit = useFeatureLimit('max_workspaces')

// Verificar se é usuário free
const isFree = useIsFreeUser()

// Obter nome do plano
const planName = usePlanName()
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

### Criar Assinatura

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Frontend  │     │  Backend   │     │ Mercado    │     │  Frontend  │
│  (Modal)   │     │            │     │ Pago       │     │ (Settings) │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      │                  │                  │                  │
      │ POST /subscribe  │                  │                  │
      ├─────────────────►│                  │                  │
      │                  │ POST /preapproval│                  │
      │                  ├─────────────────►│                  │
      │                  │◄─────────────────┤                  │
      │                  │    { init_point }│                  │
      │◄─────────────────┤                  │                  │
      │  { initPoint }   │                  │                  │
      │                  │                  │                  │
      │ redirect ────────┼──────────────────►                  │
      │                  │                  │ (checkout)       │
      │                  │                  │                  │
      │                  │                  │ redirect ───────►│
      │                  │                  │ /settings?sub=ok │
      │                  │                  │                  │
      │                  │ POST /webhook    │                  │
      │                  │◄─────────────────┤                  │
      │                  │ (authorized)     │                  │
      │                  │                  │                  │
      │                  ├── update DB ─────┤                  │
      │                  │   ACTIVE         │                  │
```

### Cancelar Assinatura

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Frontend  │     │  Backend   │     │ Mercado    │
│ (Settings) │     │            │     │ Pago       │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      │                  │                  │
      │ POST /cancel     │                  │
      ├─────────────────►│                  │
      │                  │ PUT /preapproval │
      │                  ├─────────────────►│
      │                  │ status:cancelled │
      │                  │◄─────────────────┤
      │                  │                  │
      │                  ├── update DB ─────┤
      │                  │   CANCELED       │
      │◄─────────────────┤                  │
      │  { success }     │                  │
```

---

## Planos Configurados

| Plano | Preço | Ciclos | Workspaces | Sessões/dia | Exportar | Histórico |
|-------|-------|--------|------------|-------------|----------|-----------|
| Free | R$ 0 | 1 | 2 | 20 | Não | 30 dias |
| Pro | R$ 19,90/mês | 10 | 10 | Ilimitado | Sim | 365 dias |
| Pro Annual | R$ 167,16/ano | 10 | 10 | Ilimitado | Sim | 365 dias |

> **Nota:** Pro Annual oferece 30% de desconto sobre o Pro mensal (R$ 13,93/mês equivalente).

---

## Testes

Os testes E2E estão em `backend/test/mercadopago-service.e2e-spec.ts`:

```bash
# Executar testes
npm run test:e2e -- --testPathPattern=mercadopago
```

**Cobertura:**
- Criação de assinaturas (mensal e anual)
- Processamento de webhooks
- Cancelamento de assinaturas
- Sincronização de planos
- Tratamento de erros

---

## Considerações de Segurança

### Pendentes (TODO)
1. **Validação de assinatura do webhook** - Verificar header `x-signature` com `MERCADOPAGO_WEBHOOK_SECRET`
2. **Proteção do endpoint sync-plans** - Adicionar verificação de role admin

### Implementados
- Autenticação via JWT em todos os endpoints (exceto webhook)
- Validação de DTOs com class-validator
- Sanitização de dados de entrada

---

## Referências

- [Documentação Mercado Pago - Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/landing)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
