# Spirit Hard

Sistema full-stack para a academia Spirit Hard, com React + TypeScript no frontend, Java + Spring Boot no backend e MySQL.

## Requisitos

- Node.js 20+
- Java JDK 25+
- Docker Desktop, ou MySQL 8 instalado localmente

## Como executar

Abra três terminais na pasta do projeto:

1. Banco: `docker compose up -d`
2. Backend: `cd backend` e `.\mvnw.cmd spring-boot:run`
3. Frontend: `cd frontend`, `npm install` e `npm run dev`
4. Acesse `http://localhost:5173`

O Docker cria o banco `academia`, o usuário `projeto` e a senha `projeto123`. Para usar outro MySQL, defina `DB_URL`, `DB_USER` e `DB_PASSWORD`. O Spring cria e atualiza as tabelas automaticamente.

## Contas de demonstração

| Perfil | E-mail | Senha | Modalidade |
|---|---|---|---|
| Aluno | `aluno@spirithard.com` | `Aluno@123` | Demonstração |
| Professor | `aribeiro@spirithard.com` | `Professor@123` | Muay Thai |
| Professor | `vinicius.dantas@spirithard.com` | `Professor@123` | Boxe |
| Professor | `joao.paulo@spirithard.com` | `Professor@123` | Boxe Noturno |

Novos cadastros feitos pelo site sempre recebem o perfil de aluno. As senhas são armazenadas com BCrypt, nunca como texto puro.

## Funcionalidades

- Cadastro e login reais com sessão
- Catálogo público da Spirit Hard com horários e preços
- Inscrição somente após autenticação
- Painel do aluno com suas inscrições e cancelamento
- Painel do professor mostrando apenas suas turmas e alunos
- Bloqueio de inscrição duplicada, turma lotada ou indisponível
- Dados iniciais dos professores, aluno de demonstração e modalidades

## API principal

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/catalog/classes`
- `GET /api/student/dashboard`
- `POST /api/student/enrollments`
- `DELETE /api/student/enrollments/{id}`
- `GET /api/teacher/dashboard`

## Verificação

- Backend: `cd backend` e `.\mvnw.cmd clean test`
- Frontend: `cd frontend`, `npm run build` e `npm run lint`
