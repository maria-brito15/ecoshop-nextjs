// lib/cache.ts

import { redisGet, redisSet, redisDelPattern, redisDel } from "./redis";

// ttls em segundos por tipo de recurso
// listas de referência (categorias, marcas, certificados) expiram mais devagar porque mudam pouco
// produtos expiram mais rápido porque preço e estoque mudam com frequência
// usuários têm ttl curto pois são dados sensíveis que o próprio usuário pode alterar
export const TTL = {
  LISTA_CURTA: 5 * 60, // 5 min — categorias, marcas, certificados
  LISTA_PRODUTOS: 2 * 60, // 2 min — paginação de produtos
  ITEM: 3 * 60, // 3 min — busca por id (produto, categoria, etc.)
  USUARIO: 60, // 1 min — dados de sessão e perfil do usuário
  FOTOS: 2 * 60, // 2 min — listagem de fotos do produto (filesystem)
} as const;

// prefixos de chave usados na geração e na invalidação por padrão
export const PREFIX = {
  PRODUTOS: "produtos:",
  CATEGORIAS: "categorias:",
  MARCAS: "marcas:",
  CERTIFICADOS: "certificados:",
  USUARIOS: "usuarios:",
  FOTOS: "fotos:",
} as const;

// cache-aside genérico: tenta retornar do redis, se não tiver executa o fetcher,
// armazena o resultado e o retorna — chamado nas route handlers do next.js
// ex: const data = await comCache("produtos:page=1", TTL.LISTA_PRODUTOS, () => prisma.produto.findMany())
export async function comCache<T>(
  chave: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // tenta o cache primeiro
  const cached = await redisGet<T>(chave);
  if (cached !== null) return cached;

  // cache miss — busca no banco ou filesystem
  const fresh = await fetcher();

  // persiste no cache sem bloquear a resposta
  await redisSet(chave, fresh, ttl);

  return fresh;
}

// invalida todas as chaves de um recurso (ex: "PRODUTOS" remove "produtos:*")
// chamada nos endpoints de post, put e delete após gravar no banco
export async function invalidarCache(
  recurso: keyof typeof PREFIX,
): Promise<void> {
  await redisDelPattern(`${PREFIX[recurso]}*`);
}

// invalida múltiplos recursos de uma vez
// útil quando uma mutação afeta mais de um recurso
export async function invalidarCaches(
  recursos: (keyof typeof PREFIX)[],
): Promise<void> {
  await Promise.all(recursos.map(invalidarCache));
}

// helpers de chave — evita strings mágicas espalhadas pelo código

export function chaveProdutos(params: URLSearchParams): string {
  return `${PREFIX.PRODUTOS}${params.toString()}`; // ex: produtos:page=1&size=12
}

export function chaveProduto(id: number): string {
  return `${PREFIX.PRODUTOS}${id}`; // ex: produtos:42
}

export function chaveCategorias(): string {
  return `${PREFIX.CATEGORIAS}lista`;
}

export function chaveCategoria(id: number): string {
  return `${PREFIX.CATEGORIAS}${id}`;
}

export function chaveMarcas(): string {
  return `${PREFIX.MARCAS}lista`;
}

export function chaveMarca(id: number): string {
  return `${PREFIX.MARCAS}${id}`;
}

export function chaveCertificados(): string {
  return `${PREFIX.CERTIFICADOS}lista`;
}

export function chaveCertificado(id: number): string {
  return `${PREFIX.CERTIFICADOS}${id}`;
}

// chave para o endpoint /api/auth/me — keyed pelo id da sessão, não pela url
// porque dois usuários diferentes acessam a mesma url mas precisam de dados diferentes
export function chaveUsuarioMe(id: number): string {
  return `${PREFIX.USUARIOS}me:${id}`;
}

// chave para o endpoint /api/usuarios/[id] — perfil completo (só admin acessa)
export function chaveUsuario(id: number): string {
  return `${PREFIX.USUARIOS}${id}`;
}

// chave para a lista de usuários (só admin)
export function chaveUsuarios(): string {
  return `${PREFIX.USUARIOS}lista`;
}

// chave para as fotos de um produto — leitura do filesystem cacheada
export function chaveFotosProduto(produtoId: number): string {
  return `${PREFIX.FOTOS}produto:${produtoId}`;
}

// re-exporta redisDel para quem precisar invalidar uma chave específica (ex: item por id)
export { redisDel };
