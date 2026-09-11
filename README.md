# Projeto Interdisciplinar

Base full-stack com React + TypeScript no frontend, Java + Spring Boot no backend e MySQL.

## Requisitos

- Node.js 20+
- Java JDK 8+
- Docker Desktop (ou MySQL 8 instalado localmente)

## Executar

1. Abra o Docker Desktop e inicie o banco: `docker compose up -d`
2. Backend: `cd backend` e `.\mvnw.cmd spring-boot:run`
3. Frontend: `cd frontend` e `npm run dev`
4. Abra `http://localhost:5173`

O Maven Wrapper baixa o Maven e as bibliotecas Java na primeira execução. O arquivo `compose.yaml` cria o banco `projeto_inter` com usuário `projeto` e senha `projeto123`. As credenciais padrão podem ser substituídas por `DB_URL`, `DB_USER` e `DB_PASSWORD`.

API de exemplo: `GET/POST http://localhost:8080/api/tasks`.
