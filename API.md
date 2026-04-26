# 📡 EcoShop — Documentação da API

> **Base URL:** `/api`  
> Todas as rotas retornam `Content-Type: application/json`.  
> Erros de validação incluem o campo `detalhes` com o resultado do `.flatten()` do Zod.

---

## Sumário

- [Autenticação](#autenticação)
- [Códigos de Status](#códigos-de-status)
- [Rotas](#rotas)
  - [Auth](#-auth)
  - [Users (Registro)](#-users-registro)
  - [Usuários](#-usuários)
  - [Produtos](#-produtos)
  - [Categorias](#-categorias)
  - [Marcas](#-marcas)
  - [Certificados](#-certificados)
  - [IA — Chat](#-ia--chat)
  - [IA — Scan](#-ia--scan)

---

## Autenticação

O sistema usa **JWT armazenado em cookie `HttpOnly`**. Após o login, o cookie `token` é enviado automaticamente pelo browser em todas as requisições subsequentes — não é necessário configurar headers manualmente.

| Nível           | Como funciona                                         |
| --------------- | ----------------------------------------------------- |
| **Público**     | Nenhum token necessário                               |
| **Autenticado** | Cookie `token` válido na requisição                   |
| **ADMIN**       | Cookie `token` válido + `tipo === "ADMIN"` no payload |

---

## Códigos de Status

| Status | Significado                                               |
| ------ | --------------------------------------------------------- |
| `200`  | Sucesso                                                   |
| `201`  | Recurso criado com sucesso                                |
| `400`  | Dados inválidos (falha na validação Zod)                  |
| `401`  | Não autenticado (sem token)                               |
| `403`  | Sem permissão (token válido, mas sem acesso)              |
| `404`  | Recurso não encontrado                                    |
| `409`  | Conflito (ex: email já cadastrado)                        |
| `422`  | Conteúdo não processável (ex: imagem com baixa confiança) |
| `500`  | Erro interno no servidor                                  |
| `502`  | Erro ao contatar serviço externo (Gemini/Azure)           |
| `503`  | Serviço de IA não configurado                             |

---

## Rotas

---

### 🔐 Auth

#### `POST /api/auth` — Login

Autentica um usuário e seta o cookie `token`.

**Autenticação:** Pública

**Body:**

```json
{
  "email": "usuario@email.com",
  "senha": "minimo6"
}
```

| Campo   | Tipo   | Obrigatório | Regras                    |
| ------- | ------ | ----------- | ------------------------- |
| `email` | string | Sim         | Deve ser um e-mail válido |
| `senha` | string | Sim         | Mínimo 6 caracteres       |

**Resposta `200`:**

```json
{
  "ok": true,
  "usuario": {
    "id": 1,
    "email": "usuario@email.com",
    "tipo": "CLIENTE"
  }
}
```

> O cookie `token` (HttpOnly, Secure em produção, MaxAge 7 dias) é setado automaticamente na resposta.

**Erros:**

| Status | Mensagem                      | Causa                                  |
| ------ | ----------------------------- | -------------------------------------- |
| `400`  | `"Dados inválidos"`           | Schema inválido                        |
| `401`  | `"Email ou senha incorretos"` | Usuário não encontrado ou senha errada |
| `500`  | `"Erro interno no servidor"`  | Falha inesperada                       |

---

#### `DELETE /api/auth` — Logout

Remove o cookie `token`.

**Autenticação:** Pública

**Resposta `200`:**

```json
{ "ok": true }
```

---

### 👤 Users (Registro)

#### `POST /api/users` — Registro com auto-login

Cria um novo usuário e já seta o cookie de sessão.

**Autenticação:** Pública

**Body:**

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "minimo8chars",
  "telefone": "31999999999",
  "tipo": "CLIENTE"
}
```

| Campo      | Tipo                            | Obrigatório | Regras                |
| ---------- | ------------------------------- | ----------- | --------------------- |
| `nome`     | string                          | Sim         | Mínimo 3 caracteres   |
| `email`    | string                          | Sim         | E-mail válido e único |
| `senha`    | string                          | Sim         | Mínimo 8 caracteres   |
| `telefone` | string                          | Não         | —                     |
| `tipo`     | `CLIENTE` \| `MARCA` \| `ADMIN` | Não         | Default: `CLIENTE`    |

**Resposta `201`:**

```json
{
  "ok": true,
  "usuario": {
    "id": 5,
    "email": "maria@email.com",
    "nome": "Maria Silva",
    "tipo": "CLIENTE"
  }
}
```

> Cookie `token` é setado automaticamente.

**Erros:**

| Status | Mensagem                     | Causa            |
| ------ | ---------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`          | Schema inválido  |
| `409`  | `"Email já cadastrado"`      | E-mail duplicado |
| `500`  | `"Erro interno no servidor"` | Falha inesperada |

---

### 👥 Usuários

#### `GET /api/usuarios` — Listar usuários

Retorna todos os usuários cadastrados (sem o campo `senha`).

**Autenticação:** ADMIN

**Resposta `200`:**

```json
{
  "usuarios": [
    {
      "id": 1,
      "nome": "João Admin",
      "email": "joao@email.com",
      "telefone": null,
      "tipo": "ADMIN",
      "criadoEm": "2026-04-25T18:54:40.000Z"
    }
  ]
}
```

**Erros:**

| Status | Mensagem                    | Causa            |
| ------ | --------------------------- | ---------------- |
| `403`  | `"Acesso negado"`           | Não é ADMIN      |
| `500`  | `"Erro ao listar usuários"` | Falha inesperada |

---

#### `POST /api/usuarios` — Cadastro público

Cria um novo usuário **sem** gerar sessão (sem auto-login). Útil para cadastro administrativo.

**Autenticação:** Pública

**Body:**

```json
{
  "nome": "Ana Lima",
  "email": "ana@email.com",
  "senha": "minimo6",
  "telefone": "11988887777"
}
```

| Campo      | Tipo   | Obrigatório | Regras                |
| ---------- | ------ | ----------- | --------------------- |
| `nome`     | string | Sim         | Mínimo 1 caractere    |
| `email`    | string | Sim         | E-mail válido e único |
| `senha`    | string | Sim         | Mínimo 6 caracteres   |
| `telefone` | string | Não         | —                     |

> Usuários criados por esta rota são sempre do tipo `CLIENTE`.

**Resposta `201`:**

```json
{
  "usuario": {
    "id": 8,
    "nome": "Ana Lima",
    "email": "ana@email.com",
    "tipo": "CLIENTE"
  }
}
```

**Erros:**

| Status | Mensagem                  | Causa            |
| ------ | ------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`       | Schema inválido  |
| `409`  | `"Email já cadastrado"`   | E-mail duplicado |
| `500`  | `"Erro ao criar usuário"` | Falha inesperada |

---

#### `GET /api/usuarios/[id]` — Buscar usuário por ID

**Autenticação:** Autenticado (próprio usuário ou ADMIN)

> Um usuário autenticado só pode buscar o próprio perfil. ADMIN pode buscar qualquer ID.

**Resposta `200`:**

```json
{
  "usuario": {
    "id": 3,
    "nome": "Ana Lima",
    "email": "ana@email.com",
    "telefone": "11988887777",
    "tipo": "CLIENTE",
    "criadoEm": "2026-04-25T20:00:00.000Z"
  }
}
```

**Erros:**

| Status | Mensagem                   | Causa                                              |
| ------ | -------------------------- | -------------------------------------------------- |
| `403`  | `"Acesso negado"`          | Tentando acessar ID de outro usuário sem ser ADMIN |
| `404`  | `"Usuário não encontrado"` | ID inexistente                                     |
| `500`  | `"Erro ao buscar usuário"` | Falha inesperada                                   |

---

#### `PUT /api/usuarios/[id]` — Atualizar usuário

**Autenticação:** Autenticado (próprio usuário ou ADMIN)

**Body:**

```json
{
  "nome": "Ana Lima Atualizada",
  "telefone": "11999990000"
}
```

| Campo      | Tipo   | Obrigatório | Regras             |
| ---------- | ------ | ----------- | ------------------ |
| `nome`     | string | Não         | Mínimo 1 caractere |
| `telefone` | string | Não         | —                  |

**Resposta `200`:**

```json
{
  "usuario": {
    "id": 3,
    "nome": "Ana Lima Atualizada",
    "email": "ana@email.com",
    "tipo": "CLIENTE"
  }
}
```

**Erros:**

| Status | Mensagem                      | Causa            |
| ------ | ----------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`           | Schema inválido  |
| `403`  | `"Acesso negado"`             | Sem permissão    |
| `500`  | `"Erro ao atualizar usuário"` | Falha inesperada |

---

#### `DELETE /api/usuarios/[id]` — Remover usuário

**Autenticação:** ADMIN

**Resposta `200`:**

```json
{ "ok": true }
```

**Erros:**

| Status | Mensagem                   | Causa          |
| ------ | -------------------------- | -------------- |
| `403`  | `"Acesso negado"`          | Não é ADMIN    |
| `404`  | `"Usuário não encontrado"` | ID inexistente |

---

### 📦 Produtos

#### `GET /api/produtos` — Listar produtos

Retorna produtos paginados com filtros opcionais. Inclui categoria, marca e certificados de cada produto.

**Autenticação:** Pública

**Query Params:**

| Param         | Tipo   | Default | Descrição                      |
| ------------- | ------ | ------- | ------------------------------ |
| `page`        | number | `1`     | Número da página               |
| `size`        | number | `12`    | Itens por página               |
| `categoriaId` | number | —       | Filtra por ID da categoria     |
| `nome`        | string | —       | Busca case-insensitive no nome |

**Exemplo:**

```
GET /api/produtos?page=2&size=6&categoriaId=3&nome=sabão
```

**Resposta `200`:**

```json
{
  "produtos": [
    {
      "id": 7,
      "nome": "Sabão Orgânico",
      "descricao": "Feito com ingredientes naturais",
      "preco": "29.90",
      "fotoUrl": "https://...",
      "categoriaId": 3,
      "marcaId": 2,
      "criadoEm": "2026-04-25T18:54:40.000Z",
      "categoria": { "id": 3, "nome": "Limpeza" },
      "marca": { "id": 2, "nome": "EcoLimpa" },
      "certificados": [
        {
          "certificado": {
            "id": 1,
            "nome": "Orgânico IBD",
            "descricao": "Certificação orgânica",
            "orgaoEmissor": "IBD"
          }
        }
      ]
    }
  ],
  "page": 2,
  "size": 6,
  "total": 45
}
```

**Erros:**

| Status | Mensagem                    | Causa            |
| ------ | --------------------------- | ---------------- |
| `500`  | `"Erro ao listar produtos"` | Falha inesperada |

---

#### `POST /api/produtos` — Criar produto

**Autenticação:** ADMIN

**Body:**

```json
{
  "nome": "Sabão Orgânico",
  "descricao": "Feito com ingredientes naturais",
  "preco": 29.9,
  "categoriaId": 3,
  "marcaId": 2
}
```

| Campo         | Tipo   | Obrigatório | Regras                  |
| ------------- | ------ | ----------- | ----------------------- |
| `nome`        | string | Sim         | Mínimo 1 caractere      |
| `descricao`   | string | Não         | —                       |
| `preco`       | number | Sim         | Deve ser positivo       |
| `categoriaId` | number | Sim         | ID inteiro da categoria |
| `marcaId`     | number | Sim         | ID inteiro da marca     |

**Resposta `201`:**

```json
{
  "produto": {
    "id": 12,
    "nome": "Sabão Orgânico",
    "preco": "29.90",
    "categoria": { ... },
    "marca": { ... }
  }
}
```

**Erros:**

| Status | Mensagem                  | Causa            |
| ------ | ------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`       | Schema inválido  |
| `401`  | `"Não autorizado"`        | Sem token        |
| `403`  | `"Acesso negado"`         | Não é ADMIN      |
| `500`  | `"Erro ao criar produto"` | Falha inesperada |

---

#### `GET /api/produtos/[id]` — Buscar produto por ID

Retorna o produto com categoria, marca e todos os certificados vinculados.

**Autenticação:** Pública

**Resposta `200`:**

```json
{
  "produto": {
    "id": 7,
    "nome": "Sabão Orgânico",
    "descricao": "...",
    "preco": "29.90",
    "fotoUrl": null,
    "categoriaId": 3,
    "marcaId": 2,
    "criadoEm": "2026-04-25T18:54:40.000Z",
    "categoria": { "id": 3, "nome": "Limpeza", "descricao": null },
    "marca": { "id": 2, "nome": "EcoLimpa", "descricao": "..." },
    "certificados": [ ... ]
  }
}
```

**Erros:**

| Status | Mensagem                   | Causa            |
| ------ | -------------------------- | ---------------- |
| `404`  | `"Produto não encontrado"` | ID inexistente   |
| `500`  | `"Erro ao buscar produto"` | Falha inesperada |

---

#### `PUT /api/produtos/[id]` — Atualizar produto

> ⚠️ **Atenção:** Esta rota **não verifica autenticação** no código atual. Qualquer pessoa pode chamá-la. Recomenda-se adicionar proteção antes de ir a produção.

**Autenticação:** Nenhuma (falha de segurança)

**Body:**

```json
{
  "nome": "Sabão Orgânico Premium",
  "preco": 35.9,
  "categoriaId": 3,
  "marcaId": 2
}
```

| Campo         | Tipo   | Obrigatório | Regras             |
| ------------- | ------ | ----------- | ------------------ |
| `nome`        | string | Não         | Mínimo 1 caractere |
| `descricao`   | string | Não         | —                  |
| `preco`       | number | Não         | Deve ser positivo  |
| `categoriaId` | number | Não         | ID inteiro         |
| `marcaId`     | number | Não         | ID inteiro         |

**Resposta `200`:**

```json
{
  "produto": { "id": 7, "nome": "Sabão Orgânico Premium", ... }
}
```

**Erros:**

| Status | Mensagem                      | Causa            |
| ------ | ----------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`           | Schema inválido  |
| `500`  | `"Erro ao atualizar produto"` | Falha inesperada |

---

#### `DELETE /api/produtos/[id]` — Remover produto

> ⚠️ **Atenção:** Esta rota **não verifica autenticação** no código atual.

**Autenticação:** Nenhuma (falha de segurança)

**Resposta `200`:**

```json
{ "ok": true }
```

**Erros:**

| Status | Mensagem                   | Causa                   |
| ------ | -------------------------- | ----------------------- |
| `500`  | `"Produto não encontrado"` | ID inexistente ou falha |

---

### 🗂️ Categorias

#### `GET /api/categorias` — Listar categorias

**Autenticação:** Pública

**Resposta `200`:**

```json
{
  "categorias": [
    { "id": 1, "nome": "Cosméticos", "descricao": "Produtos para o corpo" },
    { "id": 2, "nome": "Limpeza", "descricao": null }
  ]
}
```

---

#### `POST /api/categorias` — Criar categoria

**Autenticação:** ADMIN

**Body:**

```json
{
  "nome": "Alimentação",
  "descricao": "Alimentos orgânicos e naturais"
}
```

| Campo       | Tipo   | Obrigatório | Regras                    |
| ----------- | ------ | ----------- | ------------------------- |
| `nome`      | string | Sim         | Mínimo 1 caractere, único |
| `descricao` | string | Não         | —                         |

**Resposta `201`:**

```json
{
  "categoria": { "id": 5, "nome": "Alimentação", "descricao": "..." }
}
```

**Erros:**

| Status | Mensagem                    | Causa            |
| ------ | --------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`         | Schema inválido  |
| `403`  | `"Acesso negado"`           | Não é ADMIN      |
| `500`  | `"Erro ao criar categoria"` | Falha inesperada |

---

#### `GET /api/categorias/[id]` — Buscar categoria por ID

Retorna a categoria com a lista completa de produtos vinculados.

**Autenticação:** Pública

**Resposta `200`:**

```json
{
  "categoria": {
    "id": 1,
    "nome": "Cosméticos",
    "descricao": "...",
    "produtos": [ { "id": 3, "nome": "...", ... } ]
  }
}
```

**Erros:**

| Status | Mensagem                     | Causa            |
| ------ | ---------------------------- | ---------------- |
| `404`  | `"Categoria não encontrada"` | ID inexistente   |
| `500`  | `"Erro ao buscar categoria"` | Falha inesperada |

---

#### `PUT /api/categorias/[id]` — Atualizar categoria

**Autenticação:** ADMIN

**Body:**

```json
{
  "nome": "Cosméticos Naturais",
  "descricao": "Cosméticos 100% naturais"
}
```

| Campo       | Tipo   | Obrigatório | Regras             |
| ----------- | ------ | ----------- | ------------------ |
| `nome`      | string | Não         | Mínimo 1 caractere |
| `descricao` | string | Não         | —                  |

**Resposta `200`:**

```json
{
  "categoria": { "id": 1, "nome": "Cosméticos Naturais", "descricao": "..." }
}
```

**Erros:**

| Status | Mensagem                        | Causa            |
| ------ | ------------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`             | Schema inválido  |
| `403`  | `"Acesso negado"`               | Não é ADMIN      |
| `500`  | `"Erro ao atualizar categoria"` | Falha inesperada |

---

#### `DELETE /api/categorias/[id]` — Remover categoria

**Autenticação:** ADMIN

**Resposta `200`:**

```json
{ "ok": true }
```

**Erros:**

| Status | Mensagem                     | Causa          |
| ------ | ---------------------------- | -------------- |
| `403`  | `"Acesso negado"`            | Não é ADMIN    |
| `404`  | `"Categoria não encontrada"` | ID inexistente |

---

### 🏷️ Marcas

#### `GET /api/marcas` — Listar marcas

Retorna todas as marcas com dados do usuário responsável.

**Autenticação:** Pública

**Resposta `200`:**

```json
{
  "marcas": [
    {
      "id": 1,
      "nome": "EcoLimpa",
      "descricao": "Produtos de limpeza sustentáveis",
      "usuarioId": 3,
      "usuario": { "id": 3, "nome": "João", "email": "joao@email.com" }
    }
  ]
}
```

---

#### `POST /api/marcas` — Criar marca

**Autenticação:** ADMIN

**Body:**

```json
{
  "nome": "Verde Vida",
  "descricao": "Cosméticos naturais",
  "usuarioId": 5
}
```

| Campo       | Tipo   | Obrigatório | Regras                            |
| ----------- | ------ | ----------- | --------------------------------- |
| `nome`      | string | Sim         | Mínimo 1 caractere, único         |
| `descricao` | string | Não         | —                                 |
| `usuarioId` | number | Sim         | ID inteiro do usuário responsável |

**Resposta `201`:**

```json
{
  "marca": {
    "id": 4,
    "nome": "Verde Vida",
    "descricao": "...",
    "usuarioId": 5,
    "usuario": { "id": 5, "nome": "..." }
  }
}
```

**Erros:**

| Status | Mensagem                | Causa            |
| ------ | ----------------------- | ---------------- |
| `400`  | `"Dados inválidos"`     | Schema inválido  |
| `403`  | `"Acesso negado"`       | Não é ADMIN      |
| `500`  | `"Erro ao criar marca"` | Falha inesperada |

---

#### `GET /api/marcas/[id]` — Buscar marca por ID

Retorna a marca com o usuário responsável e lista de produtos.

**Autenticação:** Pública

**Resposta `200`:**

```json
{
  "marca": {
    "id": 1,
    "nome": "EcoLimpa",
    "descricao": "...",
    "usuarioId": 3,
    "usuario": { "id": 3, "nome": "João", "email": "joao@email.com" },
    "produtos": [ { "id": 7, "nome": "Sabão Orgânico", ... } ]
  }
}
```

**Erros:**

| Status | Mensagem                 | Causa            |
| ------ | ------------------------ | ---------------- |
| `404`  | `"Marca não encontrada"` | ID inexistente   |
| `500`  | `"Erro ao buscar marca"` | Falha inesperada |

---

#### `PUT /api/marcas/[id]` — Atualizar marca

**Autenticação:** ADMIN

**Body:**

```json
{
  "nome": "EcoLimpa Pro",
  "descricao": "Nova descrição"
}
```

| Campo       | Tipo   | Obrigatório | Regras             |
| ----------- | ------ | ----------- | ------------------ |
| `nome`      | string | Não         | Mínimo 1 caractere |
| `descricao` | string | Não         | —                  |

**Resposta `200`:**

```json
{
  "marca": { "id": 1, "nome": "EcoLimpa Pro", ... }
}
```

**Erros:**

| Status | Mensagem                    | Causa            |
| ------ | --------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`         | Schema inválido  |
| `403`  | `"Acesso negado"`           | Não é ADMIN      |
| `500`  | `"Erro ao atualizar marca"` | Falha inesperada |

---

#### `DELETE /api/marcas/[id]` — Remover marca

**Autenticação:** ADMIN

**Resposta `200`:**

```json
{ "ok": true }
```

**Erros:**

| Status | Mensagem                 | Causa          |
| ------ | ------------------------ | -------------- |
| `403`  | `"Acesso negado"`        | Não é ADMIN    |
| `404`  | `"Marca não encontrada"` | ID inexistente |

---

### 🏅 Certificados

#### `GET /api/certificados` — Listar certificados

**Autenticação:** Pública

**Resposta `200`:**

```json
{
  "certificados": [
    {
      "id": 1,
      "nome": "Orgânico IBD",
      "descricao": "Certificação de produto orgânico",
      "orgaoEmissor": "IBD"
    }
  ]
}
```

---

#### `POST /api/certificados` — Criar certificado

**Autenticação:** ADMIN

**Body:**

```json
{
  "nome": "ISO 14001",
  "descricao": "Gestão ambiental",
  "orgaoEmissor": "ABNT"
}
```

| Campo          | Tipo   | Obrigatório | Regras                    |
| -------------- | ------ | ----------- | ------------------------- |
| `nome`         | string | Sim         | Mínimo 1 caractere, único |
| `descricao`    | string | Não         | —                         |
| `orgaoEmissor` | string | Sim         | Mínimo 1 caractere        |

**Resposta `201`:**

```json
{
  "certificado": { "id": 3, "nome": "ISO 14001", "orgaoEmissor": "ABNT", ... }
}
```

**Erros:**

| Status | Mensagem                      | Causa            |
| ------ | ----------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`           | Schema inválido  |
| `403`  | `"Acesso negado"`             | Não é ADMIN      |
| `500`  | `"Erro ao criar certificado"` | Falha inesperada |

---

#### `GET /api/certificados/[id]` — Buscar certificado por ID

**Autenticação:** Pública

**Resposta `200`:**

```json
{
  "certificado": {
    "id": 1,
    "nome": "Orgânico IBD",
    "descricao": "...",
    "orgaoEmissor": "IBD"
  }
}
```

**Erros:**

| Status | Mensagem                       | Causa            |
| ------ | ------------------------------ | ---------------- |
| `404`  | `"Certificado não encontrado"` | ID inexistente   |
| `500`  | `"Erro ao buscar certificado"` | Falha inesperada |

---

#### `PUT /api/certificados/[id]` — Atualizar certificado

**Autenticação:** ADMIN

**Body:**

```json
{
  "nome": "ISO 14001:2015",
  "descricao": "Gestão ambiental versão 2015",
  "orgaoEmissor": "ABNT"
}
```

| Campo          | Tipo   | Obrigatório | Regras             |
| -------------- | ------ | ----------- | ------------------ |
| `nome`         | string | Não         | Mínimo 1 caractere |
| `descricao`    | string | Não         | —                  |
| `orgaoEmissor` | string | Não         | Mínimo 1 caractere |

**Resposta `200`:**

```json
{
  "certificado": { "id": 1, "nome": "ISO 14001:2015", ... }
}
```

**Erros:**

| Status | Mensagem                          | Causa            |
| ------ | --------------------------------- | ---------------- |
| `400`  | `"Dados inválidos"`               | Schema inválido  |
| `403`  | `"Acesso negado"`                 | Não é ADMIN      |
| `500`  | `"Erro ao atualizar certificado"` | Falha inesperada |

---

#### `DELETE /api/certificados/[id]` — Remover certificado

**Autenticação:** ADMIN

**Resposta `200`:**

```json
{ "ok": true }
```

**Erros:**

| Status | Mensagem                       | Causa          |
| ------ | ------------------------------ | -------------- |
| `403`  | `"Acesso negado"`              | Não é ADMIN    |
| `404`  | `"Certificado não encontrado"` | ID inexistente |

---

### 🤖 IA — Chat

#### `POST /api/ia/chat` — Chat de sustentabilidade

Chat conversacional com o Google Gemini 2.0 Flash, especializado em sustentabilidade e reciclagem. Responde sempre em português e redireciona perguntas fora do tema.

**Autenticação:** Pública

**Body:**

```json
{
  "mensagem": "Como devo descartar pilhas usadas?",
  "historico": [
    { "role": "user", "parts": [{ "text": "Olá!" }] },
    { "role": "model", "parts": [{ "text": "Olá! Como posso ajudar?" }] }
  ]
}
```

| Campo       | Tipo   | Obrigatório | Regras                                            |
| ----------- | ------ | ----------- | ------------------------------------------------- |
| `mensagem`  | string | Sim         | Entre 1 e 2000 caracteres                         |
| `historico` | array  | Não         | Turns anteriores da conversa para manter contexto |

**Formato de cada item do `historico`:**

```json
{
  "role": "user" | "model",
  "parts": [{ "text": "conteúdo da mensagem" }]
}
```

**Resposta `200`:**

```json
{
  "resposta": "Pilhas devem ser descartadas em pontos de coleta específicos..."
}
```

**Configuração Gemini:** `temperature: 0.8` · `topK: 40` · `topP: 0.95` · `maxOutputTokens: 1024`

**Erros:**

| Status | Mensagem                          | Causa                            |
| ------ | --------------------------------- | -------------------------------- |
| `400`  | `"Dados inválidos"`               | Schema inválido                  |
| `502`  | `"Erro ao contatar IA"`           | Gemini retornou erro             |
| `502`  | `"Resposta vazia da IA"`          | Gemini retornou texto vazio      |
| `503`  | `"Serviço de IA não configurado"` | `GEMINI_KEY` ausente ou inválida |
| `500`  | `"Erro interno no servidor"`      | Falha inesperada                 |

---

### 🔍 IA — Scan

#### `POST /api/ia/scan` — Análise de material reciclável

Recebe uma imagem e executa um pipeline de dois estágios: classifica o material via **Azure Custom Vision** e depois gera uma análise de sustentabilidade detalhada via **Google Gemini**.

**Autenticação:** Pública

**Content-Type:** `multipart/form-data`

| Campo   | Tipo | Obrigatório | Regras                                |
| ------- | ---- | ----------- | ------------------------------------- |
| `image` | File | Sim         | JPEG, PNG, GIF ou WEBP · Máximo 10 MB |

**Exemplo (fetch):**

```js
const form = new FormData();
form.append("image", arquivo);

const res = await fetch("/api/ia/scan", { method: "POST", body: form });
```

**Resposta `200` — Identificação bem-sucedida:**

```json
{
  "sucesso": true,
  "material": "plástico",
  "confianca": 92.5,
  "imageId": "analise_1714000000_abc123",
  "timestamp": "2026-04-26T12:00:00.000Z",
  "analise_sustentabilidade": {
    "impacto_ambiental": "O plástico leva centenas de anos para...",
    "tempo_decomposicao": "Entre 100 e 500 anos dependendo...",
    "onde_descartar": "Lixeira vermelha da coleta seletiva...",
    "reciclabilidade": "Alto — reciclável em 80% dos municípios...",
    "dicas_sustentaveis": "Prefira embalagens retornáveis...",
    "beneficios_reciclagem": "Reciclar 1 tonelada de plástico economiza..."
  }
}
```

**Resposta `422` — Confiança insuficiente:**

```json
{
  "sucesso": false,
  "mensagem": "Não foi possível identificar o objeto com confiança suficiente.",
  "confianca": 45.2,
  "confianca_minima_requerida": 70,
  "material_provavel": "outros",
  "imageId": "analise_1714000000_xyz789",
  "timestamp": "2026-04-26T12:00:00.000Z",
  "sugestao": "Tente tirar uma foto mais próxima e com melhor iluminação."
}
```

**Pipeline interno:**

```
Imagem recebida (multipart)
    │
    ▼
Azure Custom Vision
    ├── Sem predições → sucesso: false (422)
    ├── Confiança < 70% ou tag = "outros" → sucesso: false (422)
    └── Confiança >= 70%
            │
            ▼
        Gemini 2.0 Flash
            ├── JSON válido com 6 campos → sucesso: true (200)
            └── Falha/JSON inválido → analiseBasica() fallback (200)
```

**Erros:**

| Status | Mensagem                                               | Causa                   |
| ------ | ------------------------------------------------------ | ----------------------- |
| `400`  | `"Nenhuma imagem enviada"`                             | Campo `image` ausente   |
| `400`  | `"Formato inválido. Use: jpg, jpeg, png, gif ou webp"` | Tipo MIME não permitido |
| `400`  | `"Arquivo muito grande (máx: 10MB)"`                   | Arquivo acima do limite |
| `500`  | `"Erro ao processar análise"`                          | Falha inesperada        |

---
