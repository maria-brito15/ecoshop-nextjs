// types/domain.ts

/**
 * ============================================================================
 * DOMAIN TYPES
 * ============================================================================
 * Este arquivo contém os tipos principais que representam as entidades de
 * negócio do EcoShop. Todos os tipos aqui são baseados no schema do Prisma
 * e são usados em toda a aplicação (frontend e backend).
 *
 * Estes tipos NÃO devem conter lógica de validação ou transformação —
 * apenas definições de estrutura de dados.
 * ============================================================================
 */

/**
 * Representa uma foto associada a um produto.
 * As fotos são armazenadas no sistema de arquivos em public/data_fotos/
 */
export interface Foto {
  /** Nome único do arquivo gerado pelo sistema (ex: "123_abc123.jpg") */
  nome: string;
  /** URL pública para acessar a foto via browser */
  url: string;
}

/**
 * Resposta da API ao listar fotos de um produto.
 * Retornado pelos endpoints GET /api/produtos/{id}/fotos
 */
export interface FotosResponse {
  /** Array de fotos encontradas para o produto */
  fotos: Foto[];
  /** Quantidade total de fotos (equivalente a fotos.length) */
  total: number;
  /** ID do produto ao qual as fotos pertencem */
  produtoId: number;
}

/**
 * Produto sustentável disponível no catálogo.
 * Core da aplicação — representa itens à venda na plataforma.
 */
export interface Produto {
  id: number;
  /** Nome exibido na listagem e detalhe do produto */
  nome: string;
  /** Descrição detalhada do produto e seus atributos sustentáveis */
  descricao?: string;
  /** Preço em reais (BRL). Armazenado como Decimal no banco, serializado como number na API */
  preco: number;
  /** URL da imagem principal do produto (opcional, pode ser null) */
  fotoUrl?: string;
  /** Chave estrangeira referenciando a categoria do produto */
  categoriaId: number;
  /** Chave estrangeira referenciando a marca/fabricante */
  marcaId: number;
  /** Data de cadastro do produto no sistema */
  criadoEm: Date;
  /** Relacionamento com a entidade Categoria (populado quando include.categoria é true) */
  categoria?: Categoria;
  /** Relacionamento com a entidade Marca (populado quando include.marca é true) */
  marca?: Marca;
  /** Lista de certificações vinculadas a este produto (relacionamento muitos-para-muitos) */
  certificados?: ProdutoCertificado[];
}

/**
 * Categoria de produtos (ex: "Roupas Sustentáveis", "Alimentos Orgânicos").
 * Usada para agrupar produtos similares e filtrar no frontend.
 */
export interface Categoria {
  id: number;
  /** Nome único da categoria (ex: "Cosméticos Naturais") */
  nome: string;
  /** Descrição opcional explicando o que a categoria abrange */
  descricao?: string;
}

/**
 * Marca ou fabricante de produtos sustentáveis.
 * Cada marca está associada a um usuário do tipo "MARCA" ou "ADMIN".
 */
export interface Marca {
  id: number;
  /** Nome da marca (ex: "EcoBrand", "Pureza Naturais") */
  nome: string;
  /** Descrição da marca, sua história e compromissos sustentáveis */
  descricao?: string;
  /** ID do usuário responsável pela marca (dono ou administrador) */
  usuarioId: number;
  /** Dados resumidos do usuário responsável (populado via include.usuario) */
  usuario?: UsuarioResumido;
  /** Lista de produtos desta marca (populado via include.produtos) */
  produtos?: Produto[];
}

/**
 * Certificação de sustentabilidade (ex: "FSC", "Orgânico Brasil", "Eureciclo").
 * Atestam que o produto atende a padrões ambientais rigorosos.
 */
export interface Certificado {
  id: number;
  /** Nome do certificado (ex: "Cruelty Free") — único no sistema */
  nome: string;
  /** Descrição detalhada do que o certificado garante */
  descricao?: string;
  /** Órgão ou entidade emissora do certificado (ex: "PETA", "SisOrg") */
  orgaoEmissor: string;
}

/**
 * Relacionamento muitos-para-muitos entre Produto e Certificado.
 * Um produto pode ter múltiplos certificados.
 * Um certificado pode ser atribuído a múltiplos produtos.
 */
export interface ProdutoCertificado {
  produtoId: number;
  certificadoId: number;
  /** Dados completos do certificado (populado via include.certificado) */
  certificado: Certificado;
}

/**
 * Usuário completo do sistema.
 * Inclui todos os campos sensíveis — NÃO deve ser exposto em APIs públicas.
 * Para respostas de API, prefira UsuarioResumido quando possível.
 */
export interface Usuario {
  id: number;
  nome: string;
  email: string; // único no sistema, usado para login
  telefone?: string;
  tipo: TipoUsuario; // ADMIN, CLIENTE, ou MARCA
  criadoEm: Date;
}

/**
 * Versão resumida do usuário para respostas de API.
 * Exclui campos sensíveis (senha, telefone completo?) e é segura para
 * ser retornada em endpoints que precisam identificar o responsável.
 */
export interface UsuarioResumido {
  id: number;
  nome: string;
  email: string;
}

/**
 * Papéis de usuário disponíveis no sistema.
 * - ADMIN: Acesso total ao painel administrativo e todas as operações
 * - CLIENTE: Usuário comum que pode comprar e usar o EcoScan IA
 * - MARCA: Representante de uma marca que pode gerenciar seus produtos
 */
export type TipoUsuario = "CLIENTE" | "MARCA" | "ADMIN";
