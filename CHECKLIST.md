# ✅ CHECKLIST DE DESENVOLVIMENTO — Learning Path Backend
Tecnologias: **Node.js + Fastify + Drizzle ORM + JWT**

---

## 🔐 AUTH
- [x] Criar conta (`POST /auth/create-account`)
- [x] Login com JWT (`POST /auth/authenticate`)
- [ ] Refresh token
- [x] Seleção de planta ao logar
- [ ] Logout (invalidar token - opcional)
- [X] Middleware auth
- [X] Middleware roles (student/manager/admin)
- [ ] Middleware plant-filter

---

## 👤 USERS
- [x] Listar usuários
- [ ] Buscar usuário por ID
- [ ] Editar usuário
- [ ] Alterar senha
- [ ] Desativar usuário
- [ ] Listagem filtrada por planta

---

## 🪜 JOURNEYS
- [x] Criar journey
- [x] Editar journey
- [x] Deletar journey
- [x] Listar todas as journeys
- [x] `get-journey-by-slug` com módulos/aulas
- [ ] Journey pertencente a planta
- [ ] Registar progresso e porcentagem
- [ ] Completar journey
- [ ] Gerar certificado

---

## 📦 MODULES
- [x] Criar módulo
- [x] Editar módulo
- [x] Deletar módulo
- [ ] Listar módulos da journey
- [ ] Obrigatoriedade de ordem
- [ ] Bloqueio de acesso se módulo anterior não concluído
- [ ] Progresso do módulo
- [ ] Registro e controle de tentativas da prova

---

## 🎥 LESSONS
- [x] Criar aula
- [x] Editar aula
- [ ] Deletar aula
- [x] Listar aulas do módulo
- [ ] Marcar aula como concluída
- [ ] Controle sequencial (não pular aula)
- [ ] Progresso da aula

---

## 📝 ASSESSMENTS (PROVAS)
- [ ] Criar prova por módulo
- [ ] Criar questões e alternativas
- [ ] Enviar respostas
- [ ] Calcular nota
- [ ] Permitir 3 tentativas
- [ ] Nota mínima 80%
- [ ] Resetar progresso do módulo após 3 reprovações

---

## 🎓 CERTIFICADOS
- [ ] Gerar PDF com:
  - nome do aluno
  - nome da journey
  - data de conclusão
  - código de autenticação
- [ ] Registrar emissão no banco

---

## 📊 PROGRESSO
- [ ] Salvar progresso por aula
- [ ] Salvar progresso por módulo
- [ ] Salvar progresso por journey
- [ ] Controle de datas
- [ ] Histórico de tentativas
- [ ] Endpoints:
  - [ ] get-user-progress
  - [ ] mark-lesson-completed
  - [ ] complete-module
  - [ ] complete-journey

---

## 🏢 PLANT FILTER
- [ ] Todas as queries devem filtrar por `plant_id`
- [ ] Apenas usuários da planta podem visualizar
- [ ] Admin global pode ver todas? (definir regra)

---

## 🛠 EXTRAS PROFISSIONAIS
- [ ] Paginação em rotas GET
- [ ] Logs de auditoria
- [ ] Rate limit
- [ ] Validação (Zod)
- [ ] Documentação com Swagger
- [ ] Testes automatizados
- [ ] Versionamento da API

---

## 🎖 FUTURO — SISTEMA DE COINS
- [ ] Ganhar coins por módulo concluído
- [ ] Ganhar bônus por journey concluída
- [ ] Loja interna
- [ ] Troca de coins
- [ ] Ranking
- [ ] Histórico de transações
