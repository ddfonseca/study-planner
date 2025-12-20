# 📚 Study Planner - Full Stack Application

Planner de estudos com autenticação Google OAuth, sincronização multi-dispositivo e análise de desempenho.

## 🚀 Stack Tecnológica

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL com Prisma ORM
- **Autenticação**: better-auth com Google OAuth
- **Validação**: class-validator + class-transformer

### Frontend
- **Interface**: HTML5 + CSS3 + JavaScript vanilla
- **Gráficos**: Chart.js
- **Autenticação**: Integração com backend via API REST

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
- **Login**: http://localhost:8080/login.html

## 📁 Estrutura do Projeto

```
study-planner/
├── backend/                    # Backend NestJS
│   ├── src/
│   │   ├── auth/              # Autenticação (better-auth + Google OAuth)
│   │   ├── study-sessions/    # CRUD de sessões de estudo
│   │   ├── config/            # Configurações do usuário
│   │   ├── prisma/            # Prisma service
│   │   └── main.ts            # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Schema do banco de dados
│   └── .env                   # Variáveis de ambiente
├── frontend/                   # Frontend
│   ├── public/
│   │   ├── index.html         # App principal
│   │   ├── login.html         # Página de login
│   │   ├── styles.css         # Estilos
│   │   └── app.js            # Lógica principal
│   └── src/
│       ├── api/               # Cliente API (auth, sessions, config)
│       └── utils/             # Utilitários (auth, transform)
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
cd frontend/public
python3 -m http.server 8080
# ou
npx serve . -p 8080
```

## 🐛 Troubleshooting

### Erro: "BETTER_AUTH_SECRET must be at least 32 characters"
✅ Já resolvido! A variável está configurada no `.env`

### Erro: "redirect_uri_mismatch" no Google OAuth
- Verifique se a URI no Google Console é exatamente: `http://localhost:3000/api/auth/callback/google`

### Erro: "Cannot connect to database"
- Certifique-se que o Docker Compose está rodando
- Aguarde alguns segundos para o PostgreSQL inicializar

### Frontend não carrega
- Verifique se o Nginx está rodando: `docker-compose ps`
- Acesse: http://localhost:8080/login.html

## 📊 Funcionalidades

- ✅ **Autenticação Google OAuth** - Login seguro com conta Google
- ✅ **Calendário Interativo** - Visualize e gerencie sessões de estudo
- ✅ **Dashboard com Gráficos** - Análise de desempenho com Chart.js
- ✅ **Sincronização Multi-dispositivo** - Dados salvos no backend
- ✅ **Configurações Personalizadas** - Defina metas diárias de estudo
- ⏳ **Compartilhamento** - Em desenvolvimento (FASE 4)

## 📝 Notas

- Os dados são salvos no banco PostgreSQL
- A sessão expira após 7 dias
- CORS configurado para aceitar `http://localhost:8080`
- Todos os endpoints de API (exceto auth) requerem autenticação

## 🎯 Próximos Passos

- [ ] Implementar funcionalidade de compartilhamento de planos
- [ ] Adicionar notificações de lembretes
- [ ] Exportar dados em PDF/CSV
- [ ] PWA para uso offline
- [ ] Testes automatizados
- [ ] CI/CD
- [ ] Deploy em produção

## 👨‍💻 Desenvolvimento

Criado com **NestJS**, **PostgreSQL**, **better-auth**, **Prisma**, **Chart.js** e muito ☕
