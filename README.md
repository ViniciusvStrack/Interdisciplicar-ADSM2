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
- Tela de pagamento demonstrativo antes de confirmar a inscrição, com Pix, cartão e boleto fictícios
- Painel do aluno com suas inscrições e cancelamento
- Painel do professor mostrando apenas suas turmas e alunos
- Bloqueio de inscrição duplicada, turma lotada ou indisponível
- Dados iniciais dos professores, aluno de demonstração e modalidades

## Demonstração de pagamento para a apresentação

1. Escolha uma turma em **Inscrever-se**. Se estiver fora da conta, faça login ou cadastro; a turma escolhida é mantida.
2. Na tela **Pagamento demonstrativo**, confira o horário, professor e mensalidade e escolha Pix, cartão ou boleto fictício.
3. Clique em **Confirmar pagamento simulado**. A inscrição é registrada pelo backend apenas nesta etapa, respeitando as validações existentes de matrícula.
4. A tela de confirmação informa o número da inscrição, valor demonstrativo e **R$ 0,00 cobrado**. Clique em **Ver minha agenda** para ver a turma.

Não há integração bancária, cobrança, chave Pix real ou coleta de dados de cartão. O pagamento é uma simulação visual para o projeto acadêmico e não gera registro financeiro real; somente a matrícula é persistida. Voltar antes da confirmação não cria inscrição. Se a turma estiver lotada e o aluno não tiver matrícula confirmada nela, a tela mostra o erro da API e não exibe aprovação.

Para repetir a apresentação, uma matrícula já confirmada na mesma turma é reutilizada na tela de confirmação do pagamento simulado, sem gerar outra inscrição. Isso permite demonstrar Pix várias vezes com a mesma conta. Uma turma lotada sem matrícula confirmada continua exibindo erro.

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
- Fluxo de pagamento demonstrativo: `cd frontend`, `npx playwright install chromium` (uma vez) e `npm run test:e2e`. Os testes de interface simulam a API e não alteram os dados do MySQL.

O teste opcional `payment-demo-live.spec.ts` verifica o Pix repetido com o MySQL real. Requer backend e frontend iniciados e o aluno de demonstração já inscrito em Muay Thai. No PowerShell, defina `$env:RUN_LIVE_DEMO='1'` e execute `npm run test:e2e -- payment-demo-live.spec.ts`. Esse teste reutiliza a inscrição existente e verifica que os dados de matrícula não mudaram.
