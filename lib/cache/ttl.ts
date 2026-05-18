// lib/cache/ttl.ts

/**
 * ============================================================================
 * CACHE TTL (TIME-TO-LIVE) CONSTANTS
 * ============================================================================
 * Constantes de tempo de vida para diferentes tipos de cache.
 *
 * Por que TTLs diferentes?
 * - Dados estáticos (categorias, marcas, certificados): cache mais longo
 * - Listagens de produtos: cache médio (produtos mudam com frequência)
 * - Dados do usuário: cache curto (perfil pode ser atualizado)
 * - Fotos: cache médio (novas fotos podem ser adicionadas)
 *
 * Valores em segundos.
 * ============================================================================
 */

export const TTL = {
  /**
   * Cache para listagens curtas (categorias, marcas, certificados).
   * 5 minutos = 300 segundos.
   *
   * Por que 5 minutos?
   * - Estas entidades mudam com pouca frequência (dias ou semanas)
   * - Cache longo reduz carga no banco de dados
   * - 5 minutos é seguro para consistência de dados
   */
  LISTA_CURTA: 5 * 60, // 300 segundos

  /**
   * Cache para listagens de produtos (paginadas + filtros).
   * 2 minutos = 120 segundos.
   *
   * Por que 2 minutos?
   * - Produtos mudam com mais frequência (preços, estoque)
   * - Usuários esperam ver mudanças relativamente rápido
   * - 2 minutos equilibra performance e atualidade
   */
  LISTA_PRODUTOS: 2 * 60, // 120 segundos

  /**
   * Cache para itens individuais (produto específico, categoria, marca).
   * 3 minutos = 180 segundos.
   *
   * Por que 3 minutos?
   * - Visualização de detalhes é mais frequente que listagens
   * - Cache ligeiramente mais longo que listagens
   * - Garante que atualizações de preço sejam visíveis em até 3 minutos
   */
  ITEM: 3 * 60, // 180 segundos

  /**
   * Cache para dados do usuário (perfil, sessão).
   * 1 minuto = 60 segundos.
   *
   * Por que 1 minuto (mais curto)?
   * - Usuários podem atualizar perfil (nome, telefone, senha)
   * - Dados sensíveis devem ser atualizados rapidamente
   * - Cache curto mas ainda reduz carga no banco
   */
  USUARIO: 60, // 60 segundos

  /**
   * Cache para listagens de fotos de produtos.
   * 2 minutos = 120 segundos.
   *
   * Por que 2 minutos?
   * - Fotos mudam com pouca frequência
   * - Upload de novas fotos invalida cache automaticamente
   * - Mesmo TTL das listagens de produtos
   */
  FOTOS: 2 * 60, // 120 segundos
} as const;
