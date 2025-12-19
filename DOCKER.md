# Docker Compose - Guia de Desenvolvimento

Este projeto usa Docker Compose para facilitar o desenvolvimento local com hot reload.

## Serviços

- **postgres**: Banco de dados PostgreSQL 15
- **backend**: Aplicação NestJS com hot reload

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=study_planner

# Database URL (usado pelo Prisma)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/study_planner?schema=public

# Backend Configuration
PORT=3000
NODE_ENV=development
```

## Como Usar

### Iniciar os serviços

```bash
docker-compose up -d
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas postgres
docker-compose logs -f postgres
```

### Parar os serviços

```bash
docker-compose down
```

### Parar e remover volumes (limpar dados do banco)

```bash
docker-compose down -v
```

### Executar comandos no container do backend

```bash
# Executar migrations do Prisma
docker-compose exec backend npx prisma migrate dev

# Gerar Prisma Client
docker-compose exec backend npx prisma generate

# Acessar shell do container
docker-compose exec backend sh
```

## Hot Reload

O backend está configurado com hot reload. Qualquer alteração nos arquivos TypeScript será automaticamente detectada e o servidor será reiniciado.

## Portas

- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## Primeira Execução

Na primeira vez que executar, você precisará:

1. Criar o arquivo `.env` com as variáveis acima
2. Executar `docker-compose up -d`
3. Executar as migrations do Prisma:
   ```bash
   docker-compose exec backend npx prisma migrate dev
   ```

