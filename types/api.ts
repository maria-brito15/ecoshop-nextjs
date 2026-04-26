// ============================================================
// EcoShop — Tipos da API
// ============================================================

// ------------------------------------------------------------
// Enums
// ------------------------------------------------------------

export type TipoUsuario = "CLIENTE" | "MARCA" | "ADMIN";

// ------------------------------------------------------------
// Entidades base
// ------------------------------------------------------------

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: TipoUsuario;
  criadoEm: string; // ISO 8601
};

export type UsuarioPublico = Pick<Usuario, "id" | "nome" | "email">;

export type Categoria = {
  id: number;
  nome: string;
  descricao: string | null;
};

export type Marca = {
  id: number;
  nome: string;
  descricao: string | null;
  usuarioId: number;
};

export type Certificado = {
  id: number;
  nome: string;
  descricao: string | null;
  orgaoEmissor: string;
};

export type Produto = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: string;
  fotoUrl: string | null;
  categoriaId: number;
  marcaId: number;
  criadoEm: string; // ISO 8601
  categoria: Categoria;
  marca: Marca;
  certificados: { certificado: Certificado }[];
};

// ------------------------------------------------------------
// Auth — POST /api/auth
// ------------------------------------------------------------

export type LoginBody = {
  email: string;
  senha: string;
};

export type LoginResponse = {
  ok: true;
  usuario: Pick<Usuario, "id" | "email" | "tipo">;
};

// ------------------------------------------------------------
// Users (registro com auto-login) — POST /api/users
// ------------------------------------------------------------

export type RegistroBody = {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  tipo?: TipoUsuario;
};

export type RegistroResponse = {
  ok: true;
  usuario: Pick<Usuario, "id" | "email" | "nome" | "tipo">;
};

// ------------------------------------------------------------
// Usuários — /api/usuarios
// ------------------------------------------------------------

export type ListaUsuariosResponse = {
  usuarios: Usuario[];
};

export type CadastroUsuarioBody = {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
};

export type CadastroUsuarioResponse = {
  usuario: Pick<Usuario, "id" | "nome" | "email" | "tipo">;
};

export type BuscarUsuarioResponse = {
  usuario: Usuario;
};

export type AtualizarUsuarioBody = {
  nome?: string;
  telefone?: string;
};

export type AtualizarUsuarioResponse = {
  usuario: Pick<Usuario, "id" | "nome" | "email" | "tipo">;
};

// ------------------------------------------------------------
// Produtos — /api/produtos
// ------------------------------------------------------------

export type ListaProdutosResponse = {
  produtos: Produto[];
  page: number;
  size: number;
  total: number;
};

export type BuscarProdutoResponse = {
  produto: Produto;
};

export type CriarProdutoBody = {
  nome: string;
  descricao?: string;
  preco: number;
  categoriaId: number;
  marcaId: number;
};

export type CriarProdutoResponse = {
  produto: Produto;
};

export type AtualizarProdutoBody = {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoriaId?: number;
  marcaId?: number;
};

export type AtualizarProdutoResponse = {
  produto: Produto;
};

// ------------------------------------------------------------
// Categorias — /api/categorias
// ------------------------------------------------------------

export type CategoriaComProdutos = Categoria & {
  produtos: Produto[];
};

export type ListaCategoriasResponse = {
  categorias: Categoria[];
};

export type BuscarCategoriaResponse = {
  categoria: CategoriaComProdutos;
};

export type CriarCategoriaBody = {
  nome: string;
  descricao?: string;
};

export type CriarCategoriaResponse = {
  categoria: Categoria;
};

export type AtualizarCategoriaBody = {
  nome?: string;
  descricao?: string;
};

export type AtualizarCategoriaResponse = {
  categoria: Categoria;
};

// ------------------------------------------------------------
// Marcas — /api/marcas
// ------------------------------------------------------------

export type MarcaComUsuario = Marca & {
  usuario: UsuarioPublico;
};

export type MarcaComUsuarioEProdutos = MarcaComUsuario & {
  produtos: Produto[];
};

export type ListaMarcasResponse = {
  marcas: MarcaComUsuario[];
};

export type BuscarMarcaResponse = {
  marca: MarcaComUsuarioEProdutos;
};

export type CriarMarcaBody = {
  nome: string;
  descricao?: string;
  usuarioId: number;
};

export type CriarMarcaResponse = {
  marca: MarcaComUsuario;
};

export type AtualizarMarcaBody = {
  nome?: string;
  descricao?: string;
};

export type AtualizarMarcaResponse = {
  marca: MarcaComUsuario;
};

// ------------------------------------------------------------
// Certificados — /api/certificados
// ------------------------------------------------------------

export type ListaCertificadosResponse = {
  certificados: Certificado[];
};

export type BuscarCertificadoResponse = {
  certificado: Certificado;
};

export type CriarCertificadoBody = {
  nome: string;
  descricao?: string;
  orgaoEmissor: string;
};

export type CriarCertificadoResponse = {
  certificado: Certificado;
};

export type AtualizarCertificadoBody = {
  nome?: string;
  descricao?: string;
  orgaoEmissor?: string;
};

export type AtualizarCertificadoResponse = {
  certificado: Certificado;
};

// ------------------------------------------------------------
// IA — Chat — POST /api/ia/chat
// ------------------------------------------------------------

export type HistoricoItem = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export type ChatBody = {
  mensagem: string;
  historico?: HistoricoItem[];
};

export type ChatResponse = {
  resposta: string;
};

// ------------------------------------------------------------
// IA — Scan — POST /api/ia/scan
// ------------------------------------------------------------

export type AnaliseSustentabilidade = {
  impacto_ambiental: string;
  tempo_decomposicao: string;
  onde_descartar: string;
  reciclabilidade: string;
  dicas_sustentaveis: string;
  beneficios_reciclagem: string;
};

export type ScanSucesso = {
  sucesso: true;
  material: string;
  confianca: number;
  imageId: string;
  timestamp: string; // ISO 8601
  analise_sustentabilidade: AnaliseSustentabilidade;
};

export type ScanInsuficiente = {
  sucesso: false;
  mensagem: string;
  confianca: number;
  confianca_minima_requerida: number;
  material_provavel: string;
  imageId: string;
  timestamp: string; // ISO 8601
  sugestao: string;
};

export type ScanResponse = ScanSucesso | ScanInsuficiente;

// ------------------------------------------------------------
// Erros genéricos da API
// ------------------------------------------------------------

export type ApiErro = {
  erro: string;
  detalhes?: Record<string, string[]>; // resultado do Zod .flatten()
};

export type OkResponse = {
  ok: true;
};
