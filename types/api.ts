// types/api.ts

/**
 * ============================================================================
 * API REQUEST/RESPONSE TYPES
 * ============================================================================
 * Este arquivo contém os tipos para todas as requisições e respostas das
 * APIs do EcoShop. Cada rota pública tem seu tipo de request/response
 * documentado aqui.
 *
 * Organização por entidade (produtos, categorias, marcas, etc.) seguindo
 * a estrutura RESTful da API.
 * ============================================================================
 */

import type { ResultadoScan } from "./ai";
import type {
  Foto,
  FotosResponse,
  Produto,
  Categoria,
  Marca,
  Certificado,
  ProdutoCertificado,
  Usuario,
  UsuarioResumido,
  TipoUsuario,
} from "./domain";

// Re-exporta tipos de domínio para conveniência
export type {
  Foto,
  FotosResponse,
  Produto,
  Categoria,
  Marca,
  Certificado,
  ProdutoCertificado,
  Usuario,
  UsuarioResumido,
  TipoUsuario,
};

// Re-exporta tipos de IA
export type { ResultadoScan, ChatResponse } from "./ai";

/**
 * ScanResponse é o tipo retornado pelo endpoint POST /api/ia/scan.
 * É idêntico a ResultadoScan — mantido para compatibilidade.
 */
export type ScanResponse = ResultadoScan;

// --- TIPOS DE PRODUTO ---

/**
 * Interface para o corpo da requisição de chat (re-exportada para compatibilidade).
 * Mantida separada para evitar dependência circular com types/ai.ts
 */
export interface ChatBody {
  mensagem: string;
  historico?: {
    role: "user" | "model";
    parts: { text: string }[];
  }[];
}

/**
 * Resposta paginada da listagem de produtos.
 * GET /api/produtos?page=1&size=12&categoriaId=5&nome=camiseta
 */
export interface ListaProdutosResponse {
  /** Array de produtos da página atual (ordenados por id ascendente) */
  produtos: Produto[];
  /** Número da página atual (1-indexado) */
  page: number;
  /** Quantidade de itens por página (padrão: 12) */
  size: number;
  /** Total de produtos que atendem aos filtros (antes da paginação) */
  total: number;
}

/**
 * Resposta da busca de um produto específico.
 * GET /api/produtos/{id}
 */
export interface BuscarProdutoResponse {
  produto: Produto;
}

/**
 * Corpo da requisição para criar um novo produto.
 * POST /api/produtos
 * Requer autenticação ADMIN.
 */
export interface CriarProdutoBody {
  nome: string;
  descricao?: string;
  preco: number;
  categoriaId: number;
  marcaId: number;
}

/**
 * Resposta da criação de um produto.
 * Retorna o produto recém-criado com ID gerado.
 * Status: 201 Created
 */
export interface CriarProdutoResponse {
  produto: Produto;
}

/**
 * Corpo da requisição para atualizar um produto.
 * PUT /api/produtos/{id}
 * Todos os campos são opcionais — atualização parcial permitida.
 * Requer autenticação ADMIN.
 */
export interface AtualizarProdutoBody {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoriaId?: number;
  marcaId?: number;
}

/**
 * Resposta da atualização de um produto.
 * Retorna o produto com os dados atualizados.
 */
export interface AtualizarProdutoResponse {
  produto: Produto;
}

// --- TIPOS DE CATEGORIA ---

/**
 * Resposta da listagem de categorias.
 * GET /api/categorias
 * Endpoint público (não requer autenticação).
 */
export interface ListaCategoriasResponse {
  categorias: Categoria[];
}

/**
 * Resposta da busca de uma categoria específica.
 * GET /api/categorias/{id}
 */
export interface BuscarCategoriaResponse {
  categoria: Categoria;
}

/**
 * Corpo da requisição para criar uma nova categoria.
 * POST /api/categorias
 * Requer autenticação ADMIN.
 */
export interface CriarCategoriaBody {
  nome: string;
  descricao?: string;
}

/**
 * Resposta da criação de uma categoria.
 * Status: 201 Created
 */
export interface CriarCategoriaResponse {
  categoria: Categoria;
}

/**
 * Corpo da requisição para atualizar uma categoria.
 * PUT /api/categorias/{id}
 * Atualização parcial (apenas campos enviados são alterados).
 * Requer autenticação ADMIN.
 */
export interface AtualizarCategoriaBody {
  nome?: string;
  descricao?: string;
}

/**
 * Resposta da atualização de uma categoria.
 */
export interface AtualizarCategoriaResponse {
  categoria: Categoria;
}

// --- TIPOS DE MARCA ---

/**
 * Resposta da listagem de marcas.
 * GET /api/marcas
 * Endpoint público (usuários podem visualizar marcas antes de comprar).
 */
export interface ListaMarcasResponse {
  marcas: Marca[];
}

/**
 * Resposta da busca de uma marca específica.
 * GET /api/marcas/{id}
 */
export interface BuscarMarcaResponse {
  marca: Marca;
}

/**
 * Corpo da requisição para criar uma nova marca.
 * POST /api/marcas
 * Requer autenticação ADMIN.
 */
export interface CriarMarcaBody {
  nome: string;
  descricao?: string;
  usuarioId: number;
}

/**
 * Resposta da criação de uma marca.
 * Status: 201 Created
 */
export interface CriarMarcaResponse {
  marca: Marca;
}

/**
 * Corpo da requisição para atualizar uma marca.
 * PUT /api/marcas/{id}
 * Requer autenticação ADMIN.
 */
export interface AtualizarMarcaBody {
  nome?: string;
  descricao?: string;
}

/**
 * Resposta da atualização de uma marca.
 */
export interface AtualizarMarcaResponse {
  marca: Marca;
}

// --- TIPOS DE CERTIFICADO ---

/**
 * Resposta da listagem de certificados.
 * GET /api/certificados
 * Endpoint público (certificações são exibidas nos produtos).
 */
export interface ListaCertificadosResponse {
  certificados: Certificado[];
}

/**
 * Resposta da busca de um certificado específico.
 * GET /api/certificados/{id}
 */
export interface BuscarCertificadoResponse {
  certificado: Certificado;
}

/**
 * Corpo da requisição para criar um novo certificado.
 * POST /api/certificados
 * Requer autenticação ADMIN.
 */
export interface CriarCertificadoBody {
  nome: string;
  descricao?: string;
  orgaoEmissor: string;
}

/**
 * Resposta da criação de um certificado.
 * Status: 201 Created
 */
export interface CriarCertificadoResponse {
  certificado: Certificado;
}

/**
 * Corpo da requisição para atualizar um certificado.
 * PUT /api/certificados/{id}
 * Requer autenticação ADMIN.
 */
export interface AtualizarCertificadoBody {
  nome?: string;
  descricao?: string;
  orgaoEmissor?: string;
}

/**
 * Resposta da atualização de um certificado.
 */
export interface AtualizarCertificadoResponse {
  certificado: Certificado;
}

// --- TIPOS DE USUÁRIO ---

/**
 * Resposta da listagem de usuários (admin).
 * GET /api/usuarios
 * Requer autenticação ADMIN.
 */
export interface ListaUsuariosResponse {
  usuarios: Usuario[];
}

/**
 * Resposta da busca de um usuário específico.
 * GET /api/usuarios/{id}
 * Usuários comuns só podem ver o próprio perfil.
 * Admin pode ver qualquer usuário.
 */
export interface BuscarUsuarioResponse {
  usuario: Usuario;
}

/**
 * Corpo da requisição para criar usuário (admin).
 * POST /api/usuarios
 * Requer autenticação ADMIN.
 * Permite criar usuários de qualquer tipo (inclusive ADMIN).
 */
export interface CriarUsuarioBody {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo?: "CLIENTE" | "MARCA" | "ADMIN";
}

/**
 * Resposta da criação de um usuário (admin).
 */
export interface CriarUsuarioResponse {
  usuario: Usuario;
}

/**
 * Corpo da requisição para atualizar um usuário.
 * PUT /api/usuarios/{id}
 */
export interface AtualizarUsuarioBody {
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
}

/**
 * Resposta da atualização de um usuário.
 */
export interface AtualizarUsuarioResponse {
  usuario: Usuario;
}

// --- TIPOS DE AUTENTICAÇÃO ---

/**
 * Corpo da requisição de login.
 * POST /api/auth
 * Endpoint público.
 */
export interface LoginBody {
  email: string;
  senha: string;
}

/**
 * Resposta do login bem-sucedido.
 * O token JWT é armazenado em cookie httpOnly (não retornado no corpo).
 */
export interface LoginResponse {
  ok: boolean;
  usuario: {
    id: number;
    email: string;
    tipo: string;
  };
}

/**
 * Corpo da requisição de registro público.
 * POST /api/users
 * Endpoint público — qualquer pessoa pode criar conta.
 * Por padrão, tipo é "CLIENTE".
 */
export interface RegistroBody {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
}

/**
 * Resposta do registro bem-sucedido.
 * O usuário é automaticamente logado (cookie JWT é setado).
 */
export interface RegistroResponse {
  ok: boolean;
  usuario: {
    id: number;
    email: string;
    nome: string;
    tipo: string;
  };
}

/**
 * Resposta genérica para operações que retornam apenas ok/erro.
 * Usada em DELETE, logout, etc.
 */
export interface OkResponse {
  ok: boolean;
}

/**
 * Resposta do endpoint /api/auth/me
 * Retorna os dados do usuário atualmente autenticado (ou null).
 */
export interface AuthMeResponse {
  usuario: UsuarioResumido | null;
}
