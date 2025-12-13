# Learning Path Backend

Backend de uma **plataforma corporativa de treinamentos**, inspirada em soluções como Rocketseat e Alura, desenvolvida para uso interno em empresas.

O objetivo do projeto é centralizar trilhas de aprendizado, acompanhar o progresso dos colaboradores e incentivar o desenvolvimento contínuo através de módulos, aulas, provas e certificados.

---

## 🎯 Objetivo do Projeto

Criar uma plataforma onde colaboradores possam:
- acessar trilhas de treinamento organizadas
- consumir conteúdos em formato de PDF e vídeo
- avançar de forma sequencial
- realizar provas ao final dos módulos
- acompanhar seu progresso
- obter certificados ao concluir uma trilha

E onde administradores possam:
- criar e gerenciar trilhas, módulos, aulas e provas
- controlar permissões por planta e setor
- acompanhar a evolução dos usuários

---

## 🧠 Conceito da Plataforma

A estrutura de aprendizado segue o modelo:

**Journey (Trilha)**  
→ **Modules (Módulos)**  
→ **Lessons (Aulas)**  

Cada módulo possui uma prova obrigatória ao final, garantindo que o conteúdo foi assimilado antes do avanço.

---

## 🏢 Organização Corporativa

O sistema é organizado por:
- **Plantas**
- **Setores**
- **Usuários com diferentes permissões**

Todo o conteúdo é sempre filtrado pela planta selecionada, garantindo isolamento e organização dos treinamentos.

---

## 📊 Progresso e Avaliação

- O progresso é salvo por aula, módulo e trilha
- O avanço é sequencial (não é permitido pular etapas)
- Cada prova possui limite de tentativas
- A reprovação força a revisão do conteúdo
- Certificados são gerados ao concluir trilhas

---

## 🎁 Gamificação (Planejado)

Como evolução futura, o sistema contará com:
- sistema de moedas internas
- recompensas por conclusão de módulos
- loja interna para troca de pontos
- ranking de engajamento

---

## 🛠 Tecnologias Utilizadas

- **Node.js**
- **Fastify**
- **TypeScript**
- **Drizzle ORM**
- **PostgreSQL**

---

## 📄 Status do Projeto

🚧 Em desenvolvimento  
O roadmap e o checklist de funcionalidades estão disponíveis no arquivo:

➡️ **CHECKLIST.md**

---

## 📌 Observação

Este repositório representa o **backend** da aplicação.  
O frontend será desenvolvido separadamente.

---

## 📜 Licença

MIT License
