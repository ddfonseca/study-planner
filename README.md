# Study Planner - Backend

Backend NestJS com autenticação Google OAuth (better-auth) e API RESTful para o Study Planner.

## Stack Tecnológico

- **Framework**: NestJS + Express + TypeScript
- **Database**: PostgreSQL com Prisma ORM  
- **Autenticação**: better-auth com Google OAuth
- **Validação**: class-validator + class-transformer

## Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- Conta Google Cloud Console (para OAuth credentials)

## Setup Inicial

### 1. Instalar dependências

\`\`\`bash
npm install
\`\`\`

### 2. Configurar variáveis de ambiente

Copie o arquivo \`.env.example\` para \`.env\` e preencha com suas credenciais.

### 3. Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie credenciais OAuth 2.0
3. Adicione URI: \`http://localhost:3000/api/auth/callback/google\`

### 4. Executar migrations

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

### 5. Iniciar servidor

\`\`\`bash
npm run start:dev
\`\`\`

Servidor disponível em \`http://localhost:3000\`
