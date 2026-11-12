// types/api.ts

/**
 * API REQUEST/RESPONSE TYPES
 *
 * This file contains the types for all requests and responses of the
 * EcoShop APIs. Each public route has its request/response type
 * documented here.
 *
 * Organized by entity (products, categories, brands, etc.) following
 * the API's RESTful structure.
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

// Re-exports domain types for convenience
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
 * ScanResponse is the type returned by the POST /api/ia/scan endpoint.
 * It is identical to ScanResult — kept for compatibility.
 */
export type ScanResponse = ScanResult;

// --- PRODUCT TYPES ---

/**
 * Interface for the chat request body (re-exported for compatibility).
 * Kept separate to avoid a circular dependency with types/ai.ts
 */
export interface ChatBody {
  mensagem: string;
  historico?: {
    role: "user" | "model";
    parts: { text: string }[];
  }[];
}

/**
 * Paginated response of the product listing.
 * GET /api/produtos?page=1&size=12&categoriaId=5&nome=t-shirt
 */
export interface ListProductsResponse {
  /** Array of products of the current page (ordered by ascending id) */
  produtos: Product[];
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page (default: 12) */
  size: number;
  /** Total products matching the filters (before pagination) */
  total: number;
}

/**
 * Response of fetching a specific product.
 * GET /api/produtos/{id}
 */
export interface GetProductResponse {
  produto: Product;
}

/**
 * Request body to create a new product.
 * POST /api/produtos
 * Requires ADMIN authentication.
 */
export interface CreateProductBody {
  nome: string;
  descricao?: string;
  preco: number;
  categoriaId: number;
  marcaId: number;
}

/**
 * Response of creating a product.
 * Returns the newly created product with the generated ID.
 * Status: 201 Created
 */
export interface CreateProductResponse {
  produto: Product;
}

/**
 * Request body to update a product.
 * PUT /api/produtos/{id}
 * All fields are optional — partial updates are allowed.
 * Requires ADMIN authentication.
 */
export interface UpdateProductBody {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoriaId?: number;
  marcaId?: number;
  /** Fully replaces the certificate links (REQ-PROD-05); `[]` removes all */
  certificadoIds?: number[];
}

/**
 * Response of updating a product.
 * Returns the product with the updated data.
 */
export interface UpdateProductResponse {
  produto: Product;
}

// --- TIPOS DE CATEGORIA ---

/**
 * Response of the category listing.
 * GET /api/categorias
 * Public endpoint (no authentication required).
 */
export interface ListCategoriesResponse {
  categorias: Category[];
}

/**
 * Response of fetching a specific category.
 * GET /api/categorias/{id}
 */
export interface GetCategoryResponse {
  categoria: Category;
}

/**
 * Request body to create a new category.
 * POST /api/categorias
 * Requires ADMIN authentication.
 */
export interface CreateCategoryBody {
  nome: string;
  descricao?: string;
}

/**
 * Response of creating a category.
 * Status: 201 Created
 */
export interface CreateCategoryResponse {
  categoria: Category;
}

/**
 * Request body to update a category.
 * PUT /api/categorias/{id}
 * Partial update (only the fields sent are changed).
 * Requires ADMIN authentication.
 */
export interface UpdateCategoryBody {
  nome?: string;
  descricao?: string;
}

/**
 * Response of updating a category.
 */
export interface UpdateCategoryResponse {
  categoria: Category;
}

// --- BRAND TYPES ---

/**
 * Response of the brand listing.
 * GET /api/marcas
 * Public endpoint (users can see brands before buying).
 */
export interface ListBrandsResponse {
  marcas: Brand[];
}

/**
 * Response of fetching a specific brand.
 * GET /api/marcas/{id}
 */
export interface GetBrandResponse {
  marca: Brand;
}

/**
 * Request body to create a new brand.
 * POST /api/marcas
 * Requires ADMIN authentication.
 */
export interface CreateBrandBody {
  nome: string;
  descricao?: string;
  usuarioId: number;
}

/**
 * Response of creating a brand.
 * Status: 201 Created
 */
export interface CreateBrandResponse {
  marca: Brand;
}

/**
 * Request body to update a brand.
 * PUT /api/marcas/{id}
 * Requires ADMIN authentication.
 */
export interface UpdateBrandBody {
  nome?: string;
  descricao?: string;
}

/**
 * Response of updating a brand.
 */
export interface UpdateBrandResponse {
  marca: Brand;
}

/**
 * Response of approving a pending brand.
 * POST /api/marcas/{id}/aprovar
 * Requires ADMIN authentication. REQ-USR-03, ADR-0018.
 */
export interface ApproveBrandResponse {
  marca: Brand;
}

// --- TIPOS DE CERTIFICADO ---

/**
 * Response of the certificate listing.
 * GET /api/certificados
 * Public endpoint (certifications are shown on products).
 */
export interface ListCertificatesResponse {
  certificados: Certificate[];
}

/**
 * Response of fetching a specific certificate.
 * GET /api/certificados/{id}
 */
export interface GetCertificateResponse {
  certificado: Certificate;
}

/**
 * Request body to create a new certificate.
 * POST /api/certificados
 * Requires ADMIN authentication.
 */
export interface CreateCertificateBody {
  nome: string;
  descricao?: string;
  orgaoEmissor: string;
}

/**
 * Response of creating a certificate.
 * Status: 201 Created
 */
export interface CreateCertificateResponse {
  certificado: Certificate;
}

/**
 * Request body to update a certificate.
 * PUT /api/certificados/{id}
 * Requires ADMIN authentication.
 */
export interface UpdateCertificateBody {
  nome?: string;
  descricao?: string;
  orgaoEmissor?: string;
}

/**
 * Response of updating a certificate.
 */
export interface UpdateCertificateResponse {
  certificado: Certificate;
}

// --- USER TYPES ---

/**
 * Response of the user listing (admin).
 * GET /api/usuarios
 * Requires ADMIN authentication.
 */
export interface ListUsersResponse {
  usuarios: User[];
}

/**
 * Response of fetching a specific user.
 * GET /api/usuarios/{id}
 * Regular users can only see their own profile.
 * Admin can see any user.
 */
export interface GetUserResponse {
  usuario: User;
}

/**
 * Request body to create a user (admin).
 * POST /api/usuarios
 * Requires ADMIN authentication.
 * Allows creating users of any type (including ADMIN).
 */
export interface CreateUserBody {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo?: "CLIENTE" | "MARCA" | "ADMIN";
}

/**
 * Response of creating a user (admin).
 */
export interface CreateUserResponse {
  usuario: User;
}

/**
 * Request body to update a user.
 * PUT /api/usuarios/{id}
 */
export interface UpdateUserBody {
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
}

/**
 * Response of updating a user.
 */
export interface UpdateUserResponse {
  usuario: User;
}

// --- AUTHENTICATION TYPES ---

/**
 * Login request body.
 * POST /api/auth
 * Public endpoint.
 */
export interface LoginBody {
  email: string;
  senha: string;
}

/**
 * Response of a successful login.
 * The JWT is stored in an httpOnly cookie (not returned in the body).
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
 * Public registration request body.
 * POST /api/users
 * Public endpoint — anyone can create an account.
 * By default, the type is "CLIENTE".
 *
 * `marcaNome` is required when `tipo: "MARCA"` (REQ-AUTH-14): the request
 * stays pending until an ADMIN approves it (REQ-AUTH-11, ADR-0018).
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
 * Response of a successful registration.
 * The user is logged in automatically (JWT cookie is set).
 * `marcaPendente: true` indicates that the registration as MARCA is still awaiting
 * approval from an ADMIN — for now the user has CLIENTE rights.
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
 * Generic response for operations that return only ok/error.
 * Used in DELETE, logout, etc.
 */
export interface OkResponse {
  ok: boolean;
}

/**
 * Response of the /api/auth/me endpoint
 * Returns the currently authenticated user's data (or null).
 */
export interface AuthMeResponse {
  usuario: UserSummary | null;
}
