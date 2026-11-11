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

import type { ScanResult } from "./ai";
import type {
  Photo,
  PhotosResponse,
  Product,
  Category,
  Brand,
  BrandStatus,
  Certificate,
  ProductCertificate,
  User,
  UserSummary,
  UserType,
} from "./domain";

// Re-exporta tipos de domínio para conveniência
export type {
  Photo as Foto,
  PhotosResponse as FotosResponse,
  Product as Produto,
  Category as Categoria,
  Brand as Marca,
  BrandStatus as StatusMarca,
  Certificate as Certificado,
  ProductCertificate as ProdutoCertificado,
  User as Usuario,
  UserSummary as UsuarioResumido,
  UserType as TipoUsuario,
};

// Re-exporta tipos de IA
export type { ScanResult as ResultadoScan, ChatResponse } from "./ai";

/**
 * ScanResponse é o tipo retornado pelo endpoint POST /api/ia/scan.
 * É idêntico a ResultadoScan — mantido para compatibilidade.
 */
export type ScanResponse = ScanResult;

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
export interface ListProductsResponse {
  /** Array de produtos da página atual (ordenados por id ascendente) */
  produtos: Product[];
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
export interface GetProductResponse {
  produto: Product;
}

/**
 * Corpo da requisição para criar um novo produto.
 * POST /api/produtos
 * Requer autenticação ADMIN.
 */
export interface CreateProductBody {
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
export interface CreateProductResponse {
  produto: Product;
}

/**
 * Corpo da requisição para atualizar um produto.
 * PUT /api/produtos/{id}
 * Todos os campos são opcionais — atualização parcial permitida.
 * Requer autenticação ADMIN.
 */
export interface UpdateProductBody {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoriaId?: number;
  marcaId?: number;
  /** Substitui por completo o vínculo com certificados (REQ-PROD-05); `[]` remove todos */
  certificadoIds?: number[];
}

/**
 * Resposta da atualização de um produto.
 * Retorna o produto com os dados atualizados.
 */
export interface UpdateProductResponse {
  produto: Product;
}

// --- TIPOS DE CATEGORIA ---

/**
 * Resposta da listagem de categorias.
 * GET /api/categorias
 * Endpoint público (não requer autenticação).
 */
export interface ListCategoriesResponse {
  categorias: Category[];
}

/**
 * Resposta da busca de uma categoria específica.
 * GET /api/categorias/{id}
 */
export interface GetCategoryResponse {
  categoria: Category;
}

/**
 * Corpo da requisição para criar uma nova categoria.
 * POST /api/categorias
 * Requer autenticação ADMIN.
 */
export interface CreateCategoryBody {
  nome: string;
  descricao?: string;
}

/**
 * Resposta da criação de uma categoria.
 * Status: 201 Created
 */
export interface CreateCategoryResponse {
  categoria: Category;
}

/**
 * Corpo da requisição para atualizar uma categoria.
 * PUT /api/categorias/{id}
 * Atualização parcial (apenas campos enviados são alterados).
 * Requer autenticação ADMIN.
 */
export interface UpdateCategoryBody {
  nome?: string;
  descricao?: string;
}

/**
 * Resposta da atualização de uma categoria.
 */
export interface UpdateCategoryResponse {
  categoria: Category;
}

// --- TIPOS DE MARCA ---

/**
 * Resposta da listagem de marcas.
 * GET /api/marcas
 * Endpoint público (usuários podem visualizar marcas antes de comprar).
 */
export interface ListBrandsResponse {
  marcas: Brand[];
}

/**
 * Resposta da busca de uma marca específica.
 * GET /api/marcas/{id}
 */
export interface GetBrandResponse {
  marca: Brand;
}

/**
 * Corpo da requisição para criar uma nova marca.
 * POST /api/marcas
 * Requer autenticação ADMIN.
 */
export interface CreateBrandBody {
  nome: string;
  descricao?: string;
  usuarioId: number;
}

/**
 * Resposta da criação de uma marca.
 * Status: 201 Created
 */
export interface CreateBrandResponse {
  marca: Brand;
}

/**
 * Corpo da requisição para atualizar uma marca.
 * PUT /api/marcas/{id}
 * Requer autenticação ADMIN.
 */
export interface UpdateBrandBody {
  nome?: string;
  descricao?: string;
}

/**
 * Resposta da atualização de uma marca.
 */
export interface UpdateBrandResponse {
  marca: Brand;
}

/**
 * Resposta da aprovação de uma marca pendente.
 * POST /api/marcas/{id}/aprovar
 * Requer autenticação ADMIN. REQ-USR-03, ADR-0018.
 */
export interface ApproveBrandResponse {
  marca: Brand;
}

// --- TIPOS DE CERTIFICADO ---

/**
 * Resposta da listagem de certificados.
 * GET /api/certificados
 * Endpoint público (certificações são exibidas nos produtos).
 */
export interface ListCertificatesResponse {
  certificados: Certificate[];
}

/**
 * Resposta da busca de um certificado específico.
 * GET /api/certificados/{id}
 */
export interface GetCertificateResponse {
  certificado: Certificate;
}

/**
 * Corpo da requisição para criar um novo certificado.
 * POST /api/certificados
 * Requer autenticação ADMIN.
 */
export interface CreateCertificateBody {
  nome: string;
  descricao?: string;
  orgaoEmissor: string;
}

/**
 * Resposta da criação de um certificado.
 * Status: 201 Created
 */
export interface CreateCertificateResponse {
  certificado: Certificate;
}

/**
 * Corpo da requisição para atualizar um certificado.
 * PUT /api/certificados/{id}
 * Requer autenticação ADMIN.
 */
export interface UpdateCertificateBody {
  nome?: string;
  descricao?: string;
  orgaoEmissor?: string;
}

/**
 * Resposta da atualização de um certificado.
 */
export interface UpdateCertificateResponse {
  certificado: Certificate;
}

// --- TIPOS DE USUÁRIO ---

/**
 * Resposta da listagem de usuários (admin).
 * GET /api/usuarios
 * Requer autenticação ADMIN.
 */
export interface ListUsersResponse {
  usuarios: User[];
}

/**
 * Resposta da busca de um usuário específico.
 * GET /api/usuarios/{id}
 * Usuários comuns só podem ver o próprio perfil.
 * Admin pode ver qualquer usuário.
 */
export interface GetUserResponse {
  usuario: User;
}

/**
 * Corpo da requisição para criar usuário (admin).
 * POST /api/usuarios
 * Requer autenticação ADMIN.
 * Permite criar usuários de qualquer tipo (inclusive ADMIN).
 */
export interface CreateUserBody {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo?: "CLIENTE" | "MARCA" | "ADMIN";
}

/**
 * Resposta da criação de um usuário (admin).
 */
export interface CreateUserResponse {
  usuario: User;
}

/**
 * Corpo da requisição para atualizar um usuário.
 * PUT /api/usuarios/{id}
 */
export interface UpdateUserBody {
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
}

/**
 * Resposta da atualização de um usuário.
 */
export interface UpdateUserResponse {
  usuario: User;
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
 *
 * `marcaNome` é obrigatório quando `tipo: "MARCA"` (REQ-AUTH-14): o pedido
 * fica pendente de aprovação de um ADMIN (REQ-AUTH-11, ADR-0018).
 */
export interface RegistrationBody {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo?: "CLIENTE" | "MARCA";
  marcaNome?: string;
  marcaDescricao?: string;
}

/**
 * Resposta do registro bem-sucedido.
 * O usuário é automaticamente logado (cookie JWT é setado).
 * `marcaPendente: true` indica que o cadastro como MARCA ainda aguarda
 * aprovação de um ADMIN — o usuário tem, por ora, direitos de CLIENTE.
 */
export interface RegistrationResponse {
  ok: boolean;
  usuario: {
    id: number;
    email: string;
    nome: string;
    tipo: string;
  };
  marcaPendente?: boolean;
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
  usuario: UserSummary | null;
}
