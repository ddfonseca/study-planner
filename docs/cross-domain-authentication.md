# Solução de Autenticação Cross-Domain

## Problema

Ao fazer deploy de frontend e backend em domínios diferentes (ex: Netlify e Fly.io), a autenticação OAuth falha devido ao **bloqueio de cookies de terceiros** pelos navegadores modernos.

### O Problema

1. Frontend hospedado em `study-planner-front.netlify.app`
2. Backend hospedado em `study-planner-api.fly.dev`
3. Quando o usuário autentica via Google OAuth:
   - O cookie de sessão é definido no domínio do backend (`fly.dev`)
   - Quando o frontend tenta ler a sessão, o navegador bloqueia o cookie por ser de um domínio diferente (cookie de terceiros)
4. Resultado: `getSession()` retorna `null` mesmo após login bem-sucedido

### Erros Comuns

- Erro `state_mismatch` durante o callback do OAuth
- `getSession()` retornando `null` após login OAuth bem-sucedido
- Cookies não sendo enviados em requisições cross-origin

## Solução: Proxy do Netlify

Em vez de fazer requisições cross-domain, roteamos todas as chamadas de API através do proxy do Netlify. Assim:

- Todas as requisições parecem vir do mesmo domínio
- Cookies são definidos no domínio do frontend
- Sem problemas de cookies de terceiros

### Arquitetura

```
Antes (quebrado):
┌─────────────────┐    Chamadas API diretas   ┌─────────────────┐
│    Frontend     │ ─────────────────────────▶│    Backend      │
│   (Netlify)     │  (cross-domain = bloqueado)│   (Fly.io)     │
│  *.netlify.app  │                           │   *.fly.dev     │
└─────────────────┘                           └─────────────────┘

Depois (funcionando):
┌─────────────────┐    Requisições /api/*     ┌─────────────────┐
│    Frontend     │ ─────────────────────────▶│  Proxy Netlify  │
│   (Netlify)     │  (mesmo domínio = ok)     │                 │
│  *.netlify.app  │                           └────────┬────────┘
└─────────────────┘                                    │
                                                       │ Proxy para
                                                       ▼
                                              ┌─────────────────┐
                                              │    Backend      │
                                              │   (Fly.io)      │
                                              │   *.fly.dev     │
                                              └─────────────────┘
```

## Configuração

### 1. Configuração do Netlify (`frontend/netlify.toml`)

```toml
[build]
  base = "frontend"
  command = "npm install && npm run build"
  publish = "dist"

[build.environment]
  # String vazia = usar mesmo domínio (proxy do Netlify)
  VITE_API_BASE_URL = ""
  VITE_FRONTEND_URL = "https://study-planner-front.netlify.app"

# Proxy das requisições API para o backend no Fly.io (DEVE vir antes do catch-all)
[[redirects]]
  from = "/api/*"
  to = "https://study-planner-api.fly.dev/api/:splat"
  status = 200
  force = true
  headers = {X-Forwarded-Host = "study-planner-front.netlify.app"}

# Fallback SPA (catch-all para roteamento client-side)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Cliente API do Frontend (`frontend/src/lib/api/client.ts`)

```typescript
// Em produção: string vazia (usa proxy do Netlify no mesmo domínio)
// Em desenvolvimento: undefined, então usa fallback para localhost
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = envApiUrl !== undefined ? envApiUrl : 'http://localhost:3000';
```

### 3. Configuração de Auth do Backend (`backend/src/auth/auth.config.ts`)

```typescript
// URL do Frontend - todas as requisições passam pelo proxy do Netlify (mesmo domínio)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const auth = betterAuth({
  // ...
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Callback do OAuth passa pelo proxy do Netlify (mesmo domínio do frontend)
      redirectURI: `${FRONTEND_URL}/api/auth/callback/google`,
    },
  },
  // Usa URL do frontend já que todas as requisições vêm pelo proxy do Netlify
  baseURL: FRONTEND_URL,
  basePath: '/api/auth',
  trustedOrigins: [FRONTEND_URL, BACKEND_URL],
});
```

### 4. Google Cloud Console

Adicione a URI de redirecionamento que passa pelo Netlify:

```
https://study-planner-front.netlify.app/api/auth/callback/google
```

## Como Funciona

1. **Usuário clica em "Login com Google"**
   - Frontend chama `/api/auth/signin/google`
   - Netlify faz proxy para `https://study-planner-api.fly.dev/api/auth/signin/google`

2. **Fluxo OAuth do Google**
   - Usuário autentica com o Google
   - Google redireciona para `https://study-planner-front.netlify.app/api/auth/callback/google`
   - Netlify faz proxy para `https://study-planner-api.fly.dev/api/auth/callback/google`

3. **Cookie de sessão é definido**
   - Backend cria sessão e define cookie
   - Como a requisição veio pelo proxy do Netlify, o domínio do cookie é `study-planner-front.netlify.app`
   - Cookie agora é first-party (mesmo domínio do frontend)

4. **Requisições subsequentes**
   - Frontend chama `/api/auth/get-session`
   - Navegador envia o cookie (mesmo domínio)
   - Netlify faz proxy para o backend
   - Backend lê o cookie e retorna a sessão

## Desenvolvimento vs Produção

| Ambiente | `VITE_API_BASE_URL` | Chamadas API vão para |
|----------|---------------------|----------------------|
| Desenvolvimento | `undefined` (não definido) | `http://localhost:3000` |
| Produção | `""` (string vazia) | Mesmo domínio (proxy Netlify) |

## Troubleshooting

### Erro "state_mismatch"
- Verifique se a URI de redirecionamento OAuth no Google Cloud Console corresponde exatamente:
  `https://seu-frontend.netlify.app/api/auth/callback/google`

### `getSession()` retorna null
- Verifique DevTools do navegador > Application > Cookies
- Confirme que o domínio do cookie corresponde ao domínio do frontend
- Garanta que `credentials: 'include'` está definido nas opções do fetch

### Chamadas API indo para URL errada
- Verifique a variável de ambiente `VITE_API_BASE_URL` no dashboard do Netlify
- Confirme que a variável está definida como string vazia `""`, não ausente

### Proxy não funcionando
- Garanta que a regra de redirect do proxy está ANTES do redirect catch-all do SPA
- Verifique os logs de deploy do Netlify para a configuração de redirects
