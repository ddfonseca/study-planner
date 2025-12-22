# 📚 Study Planner - Full Stack Application

Planner de estudos com autenticação Google OAuth, sincronização multi-dispositivo e análise de desempenho.

## 🚀 Stack Tecnológica

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL com Prisma ORM
- **Autenticação**: better-auth com Google OAuth
- **Validação**: class-validator + class-transformer

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Gráficos**: Chart.js + react-chartjs-2
- **Estado**: Zustand
- **Roteamento**: React Router DOM

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Conta no Google Cloud Console (para OAuth)

## ⚙️ Configuração Inicial

### 1. Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **OAuth client ID**
5. Escolha **Web application**
6. Adicione as URIs de redirecionamento:
   - `http://localhost:3000/api/auth/callback/google`
7. Copie o **Client ID** e **Client Secret**

### 2. Configurar Variáveis de Ambiente

O arquivo `backend/.env` já existe. Atualize as credenciais do Google OAuth:

```env
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-seu-client-secret-aqui
```

As outras variáveis já estão configuradas:
- ✅ `BETTER_AUTH_SECRET` - Já configurado
- ✅ `DATABASE_URL` - Configurado para PostgreSQL no Docker
- ✅ `PORT`, `NODE_ENV`, `FRONTEND_URL` - Já configurados

## 🐳 Executar com Docker Compose

### Iniciar todos os serviços

```bash
docker-compose up
```

Isso iniciará:
- ✅ **PostgreSQL** (porta 5432)
- ✅ **Backend NestJS** (porta 3000)
- ✅ **Frontend Nginx** (porta 8080)

### Executar migrations do banco

Na primeira vez, em outro terminal:

```bash
docker-compose exec backend npx prisma migrate dev --name init
```

### Parar os serviços

```bash
docker-compose down
```

### Reconstruir após mudanças

```bash
docker-compose up --build
```

## 🌐 Acessar a Aplicação

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

## 📁 Estrutura do Projeto

```
study-planner/
├── backend/                    # Backend NestJS
│   ├── src/
│   │   ├── auth/              # Autenticação (better-auth + Google OAuth)
│   │   ├── study-sessions/    # CRUD de sessões de estudo
│   │   ├── weekly-goal/       # Metas semanais
│   │   ├── config/            # Configurações do usuário
│   │   ├── prisma/            # Prisma service
│   │   └── main.ts            # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Schema do banco de dados
│   └── .env                   # Variáveis de ambiente
├── frontend/                   # Frontend React + Vite
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── calendar/      # Calendário, sessões, timer
│   │   │   ├── dashboard/     # Gráficos e estatísticas
│   │   │   ├── layout/        # Layouts da aplicação
│   │   │   └── ui/            # Componentes UI (shadcn)
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── hooks/             # Custom hooks
│   │   ├── store/             # Estado global (Zustand)
│   │   ├── lib/               # API client e utilitários
│   │   └── types/             # Tipos TypeScript
│   └── index.html             # Entry point
├── docker-compose.yml         # Orquestração Docker
├── nginx.conf                 # Configuração Nginx
└── README.md                  # Este arquivo
```

## 🔑 API Endpoints

### Autenticação
- `GET /api/auth/google` - Login com Google OAuth
- `GET /api/auth/callback/google` - Callback OAuth
- `GET /api/auth/me` - Usuário atual (protegida)
- `POST /api/auth/logout` - Logout (protegida)

### Sessões de Estudo
- `GET /api/study-sessions` - Listar sessões (protegida)
- `POST /api/study-sessions` - Criar sessão (protegida)
- `PUT /api/study-sessions/:id` - Atualizar (protegida)
- `DELETE /api/study-sessions/:id` - Deletar (protegida)

### Configurações
- `GET /api/config` - Obter configuração (protegida)
- `PUT /api/config` - Atualizar configuração (protegida)

### Metas Semanais
- `GET /api/weekly-goals` - Listar metas semanais (protegida)
- `PUT /api/weekly-goals/:weekStart` - Atualizar meta semanal (protegida)

## 🛠️ Desenvolvimento

### Backend (sem Docker)

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend (sem Docker)

```bash
cd frontend
npm install
npm run dev
```

## 📊 Funcionalidades

- ✅ **Autenticação Google OAuth** - Login seguro com conta Google
- ✅ **Calendário Interativo** - Visualize e gerencie sessões de estudo
- ✅ **Timer de Estudo** - Cronômetro integrado para sessões
- ✅ **Dashboard com Gráficos** - Análise de desempenho com Chart.js
- ✅ **Heatmap Anual** - Visualização de atividade no estilo GitHub
- ✅ **Progresso Semanal** - Acompanhe suas metas semanais
- ✅ **Metas Personalizáveis** - Defina metas semanais por período
- ✅ **Adição Rápida** - Adicione sessões de forma inline
- ✅ **Sincronização Multi-dispositivo** - Dados salvos no backend

## 🌍 Deploy

O deploy é automatizado via GitHub Actions usando tags específicas.

### CI/CD com Tags

| Tag Pattern | Deploy |
|-------------|--------|
| `frontend-v*` | Frontend → Netlify |
| `backend-v*` | Backend → Fly.io |

#### Criar tag e fazer deploy

```bash
# Deploy do frontend
git tag frontend-v1.0.0
git push origin frontend-v1.0.0

# Deploy do backend
git tag backend-v1.0.0
git push origin backend-v1.0.0
```

### Configurar Secrets no GitHub

Vá em **Settings** → **Secrets and variables** → **Actions** e adicione:

#### Secrets (obrigatórios)

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `NETLIFY_AUTH_TOKEN` | Token de autenticação Netlify | `netlify login` → Account Settings → Personal Access Tokens |
| `NETLIFY_SITE_ID` | ID do site Netlify | `netlify status` ou Dashboard do Netlify |
| `FLY_API_TOKEN` | Token de autenticação Fly.io | `fly tokens create deploy` |

#### Variables (opcionais)

| Variable | Descrição |
|----------|-----------|
| `VITE_API_BASE_URL` | URL do backend (ex: `https://sua-api.fly.dev`) |
| `VITE_FRONTEND_URL` | URL do frontend (ex: `https://study-planner-front.netlify.app`) |
| `VITE_APP_NAME` | Nome da aplicação |

### URLs de Produção

- **Frontend**: https://study-planner-front.netlify.app
- **Backend**: (configurar após deploy no Fly.io)

### Deploy Manual via CLI

#### Frontend (Netlify)

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Inicializar projeto (primeira vez)
netlify init

# Deploy para produção
netlify deploy --prod --filter frontend-new

# Gerenciar variáveis de ambiente
netlify env:list --filter frontend-new
netlify env:set VITE_API_BASE_URL https://sua-api.fly.dev --filter frontend-new
```

#### Backend (Fly.io)

```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly deploy
```

## 📝 Notas

- Os dados são salvos no banco PostgreSQL
- A sessão expira após 7 dias
- CORS configurado para aceitar `http://localhost:8080`
- Todos os endpoints de API (exceto auth) requerem autenticação

## 👨‍💻 Desenvolvimento

Criado com **React**, **NestJS**, **PostgreSQL**, **better-auth**, **Prisma**, **Tailwind CSS**, **Chart.js** e **Zustand**
