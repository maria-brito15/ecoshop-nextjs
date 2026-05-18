// lib/schemas/usuario.ts

/**
 * ============================================================================
 * USUÁRIO SCHEMAS (Zod)
 * ============================================================================
 * Schemas de validação para operações relacionadas a usuários.
 *
 * Por que Zod?
 * - Validação declarativa com inferência de tipos TypeScript
 * - Mensagens de erro customizáveis
 * - Segurança contra dados maliciosos (sanitização automática)
 *
 * Este arquivo contém schemas para:
 * - Login (email + senha)
 * - Registro público (qualquer pessoa pode criar conta)
 * - Cadastro administrativo (admin pode criar usuários de qualquer tipo)
 * - Atualização de perfil (usuário editando seus próprios dados)
 *
 * IMPORTANTE: Senhas nunca são validadas em texto plano além do tamanho mínimo.
 * A segurança das senhas é responsabilidade do backend (bcrypt).
 * ============================================================================
 */

import { z } from "zod";

/**
 * Schema de validação para login.
 *
 * Regras:
 * - email: formato válido (ex: usuario@dominio.com)
 * - senha: não vazia (mínimo 1 caractere)
 *
 * NOTA: Não validamos tamanho mínimo da senha no login porque
 * usuários antigos podem ter senhas curtas (antes da regra de 8 caracteres).
 * A validação de tamanho é aplicada apenas no cadastro.
 */
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

/**
 * Schema para cadastro de usuários realizado por ADMIN.
 *
 * Diferencia do registro público por permitir:
 * - Tipo de usuário (CLIENTE, MARCA, ADMIN)
 *
 * Regras:
 * - nome: mínimo 3 caracteres
 * - email: formato válido
 * - telefone: opcional, string livre
 * - senha: mínimo 8 caracteres (recomendação de segurança OWASP)
 * - tipo: enum com padrão "CLIENTE"
 *
 * @example
 * const dados = {
 *   nome: "João Silva",
 *   email: "joao@exemplo.com",
 *   senha: "senha123456",
 *   tipo: "ADMIN"
 * };
 */
export const cadastroAdminSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  tipo: z.enum(["CLIENTE", "MARCA", "ADMIN"]).default("CLIENTE"),
});

/**
 * Schema para registro público de usuários (qualquer pessoa).
 *
 * Regras:
 * - nome: mínimo 3 caracteres
 * - email: formato válido
 * - telefone: opcional, string livre
 * - senha: mínimo 8 caracteres
 * - tipo: restrito a CLIENTE ou MARCA (ADMIN não pode ser criado via registro público)
 *
 * Por que restringir ADMIN?
 * - Segurança: apenas admins existentes podem criar outros admins
 * - Fluxo: novo usuário se cadastra como CLIENTE ou MARCA
 */
export const registroPublicoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  tipo: z.enum(["CLIENTE", "MARCA"]).default("CLIENTE"),
});

/**
 * Schema para atualização de perfil de usuário.
 *
 * TODOS os campos são opcionais — permite atualização parcial.
 * O usuário pode atualizar apenas os campos que desejar.
 *
 * Regras (quando presentes):
 * - nome: mínimo 3 caracteres (se fornecido)
 * - email: formato válido (se fornecido)
 * - telefone: string livre (se fornecido)
 * - senha: mínimo 8 caracteres (se fornecida)
 *
 * NOTA: A senha é hasheada novamente no service antes de salvar.
 *
 * @example
 * // Atualizar apenas o nome
 * const dados = { nome: "João Silva Junior" };
 *
 * // Atualizar nome e telefone
 * const dados = { nome: "João", telefone: "(11) 99999-8888" };
 *
 * // Atualizar senha
 * const dados = { senha: "nova_senha_segura_123" };
 */
export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().optional(),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").optional(),
});
