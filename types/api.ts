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
};

// Re-exports the AI types
export type { ScanResult, ChatResponse } from "./ai";

/**
 * ScanResponse is the type returned by the POST /api/ai/scan endpoint.
 * It is identical to ScanResult — kept for compatibility.
 */
export type ScanResponse = ScanResult;

// --- PRODUCT TYPES ---

/**
 * Interface for the chat request body (re-exported for compatibility).
 * Kept separate to avoid a circular dependency with types/ai.ts
 */
export interface ChatBody {
  message: string;
  history?: {
    role: "user" | "model";
    parts: { text: string }[];
  }[];
}

/**
 * Paginated response of the product listing.
 * GET /api/products?page=1&size=12&categoryId=5&name=t-shirt
 */
export interface ListProductsResponse {
  /** Array of products of the current page (ordered by ascending id) */
  products: Product[];
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page (default: 12) */
  size: number;
  /** Total products matching the filters (before pagination) */
  total: number;
}

/**
 * Response of fetching a specific product.
 * GET /api/products/{id}
 */
export interface GetProductResponse {
  product: Product;
}

/**
 * Request body to create a new product.
 * POST /api/products
 * Requires ADMIN authentication.
 */
export interface CreateProductBody {
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  brandId: number;
}

/**
 * Response of creating a product.
 * Returns the newly created product with the generated ID.
 * Status: 201 Created
 */
export interface CreateProductResponse {
  product: Product;
}

/**
 * Request body to update a product.
 * PUT /api/products/{id}
 * All fields are optional — partial updates are allowed.
 * Requires ADMIN authentication.
 */
export interface UpdateProductBody {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  brandId?: number;
  /** Fully replaces the certificate links (REQ-PROD-05); `[]` removes all */
  certificateIds?: number[];
}

/**
 * Response of updating a product.
 * Returns the product with the updated data.
 */
export interface UpdateProductResponse {
  product: Product;
}

// --- CATEGORY TYPES ---

/**
 * Response of the category listing.
 * GET /api/categories
 * Public endpoint (no authentication required).
 */
export interface ListCategoriesResponse {
  categories: Category[];
}

/**
 * Response of fetching a specific category.
 * GET /api/categories/{id}
 */
export interface GetCategoryResponse {
  category: Category;
}

/**
 * Request body to create a new category.
 * POST /api/categories
 * Requires ADMIN authentication.
 */
export interface CreateCategoryBody {
  name: string;
  description?: string;
}

/**
 * Response of creating a category.
 * Status: 201 Created
 */
export interface CreateCategoryResponse {
  category: Category;
}

/**
 * Request body to update a category.
 * PUT /api/categories/{id}
 * Partial update (only the fields sent are changed).
 * Requires ADMIN authentication.
 */
export interface UpdateCategoryBody {
  name?: string;
  description?: string;
}

/**
 * Response of updating a category.
 */
export interface UpdateCategoryResponse {
  category: Category;
}

// --- BRAND TYPES ---

/**
 * Response of the brand listing.
 * GET /api/brands
 * Public endpoint (users can see brands before buying).
 */
export interface ListBrandsResponse {
  brands: Brand[];
}

/**
 * Response of fetching a specific brand.
 * GET /api/brands/{id}
 */
export interface GetBrandResponse {
  brand: Brand;
}

/**
 * Request body to create a new brand.
 * POST /api/brands
 * Requires ADMIN authentication.
 */
export interface CreateBrandBody {
  name: string;
  description?: string;
  userId: number;
}

/**
 * Response of creating a brand.
 * Status: 201 Created
 */
export interface CreateBrandResponse {
  brand: Brand;
}

/**
 * Request body to update a brand.
 * PUT /api/brands/{id}
 * Requires ADMIN authentication.
 */
export interface UpdateBrandBody {
  name?: string;
  description?: string;
}

/**
 * Response of updating a brand.
 */
export interface UpdateBrandResponse {
  brand: Brand;
}

/**
 * Response of approving a pending brand.
 * POST /api/brands/{id}/approve
 * Requires ADMIN authentication. REQ-USR-03, ADR-0018.
 */
export interface ApproveBrandResponse {
  brand: Brand;
}

// --- CERTIFICATE TYPES ---

/**
 * Response of the certificate listing.
 * GET /api/certificates
 * Public endpoint (certifications are shown on products).
 */
export interface ListCertificatesResponse {
  certificates: Certificate[];
}

/**
 * Response of fetching a specific certificate.
 * GET /api/certificates/{id}
 */
export interface GetCertificateResponse {
  certificate: Certificate;
}

/**
 * Request body to create a new certificate.
 * POST /api/certificates
 * Requires ADMIN authentication.
 */
export interface CreateCertificateBody {
  name: string;
  description?: string;
  issuingBody: string;
}

/**
 * Response of creating a certificate.
 * Status: 201 Created
 */
export interface CreateCertificateResponse {
  certificate: Certificate;
}

/**
 * Request body to update a certificate.
 * PUT /api/certificates/{id}
 * Requires ADMIN authentication.
 */
export interface UpdateCertificateBody {
  name?: string;
  description?: string;
  issuingBody?: string;
}

/**
 * Response of updating a certificate.
 */
export interface UpdateCertificateResponse {
  certificate: Certificate;
}

// --- USER TYPES ---

/**
 * Response of the user listing (admin).
 * GET /api/users
 * Requires ADMIN authentication.
 */
export interface ListUsersResponse {
  users: User[];
}

/**
 * Response of fetching a specific user.
 * GET /api/users/{id}
 * Regular users can only see their own profile.
 * Admin can see any user.
 */
export interface GetUserResponse {
  user: User;
}

/**
 * Request body to create a user (admin).
 * POST /api/users
 * Requires ADMIN authentication.
 * Allows creating users of any type (including ADMIN).
 */
export interface CreateUserBody {
  name: string;
  email: string;
  phone?: string;
  password: string;
  type?: "CUSTOMER" | "BRAND" | "ADMIN";
}

/**
 * Response of creating a user (admin).
 */
export interface CreateUserResponse {
  user: User;
}

/**
 * Request body to update a user.
 * PUT /api/users/{id}
 */
export interface UpdateUserBody {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

/**
 * Response of updating a user.
 */
export interface UpdateUserResponse {
  user: User;
}

// --- AUTHENTICATION TYPES ---

/**
 * Login request body.
 * POST /api/auth
 * Public endpoint.
 */
export interface LoginBody {
  email: string;
  password: string;
}

/**
 * Response of a successful login.
 * The JWT is stored in an httpOnly cookie (not returned in the body).
 */
export interface LoginResponse {
  ok: boolean;
  user: {
    id: number;
    email: string;
    type: string;
  };
}

/**
 * Public registration request body.
 * POST /api/users
 * Public endpoint — anyone can create an account.
 * By default, the type is "CUSTOMER".
 *
 * `brandName` is required when `type: "BRAND"` (REQ-AUTH-14): the request
 * stays pending until an ADMIN approves it (REQ-AUTH-11, ADR-0018).
 */
export interface RegistrationBody {
  name: string;
  email: string;
  phone?: string;
  password: string;
  type?: "CUSTOMER" | "BRAND";
  brandName?: string;
  brandDescription?: string;
}

/**
 * Response of a successful registration.
 * The user is logged in automatically (JWT cookie is set).
 * `pendingBrand: true` indicates that the registration as BRAND is still awaiting
 * approval from an ADMIN — for now the user has CUSTOMER rights.
 */
export interface RegistrationResponse {
  ok: boolean;
  user: {
    id: number;
    email: string;
    name: string;
    type: string;
  };
  pendingBrand?: boolean;
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
  user: UserSummary | null;
}
