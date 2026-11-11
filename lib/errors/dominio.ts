// lib/errors/dominio.ts

/**
 * Erros de domínio tipados (Constitution, Art. VII.1).
 *
 * Services lançam estes erros; o mapeador único (`mapeiaErro`, em
 * `lib/http/responses.ts`) os converte em resposta HTTP. Nunca se decide a
 * resposta pelo texto da mensagem (Art. VII.2).
 *
 * São duas classes porque os casos atuais só pedem dois desfechos: recurso que
 * não existe (404) e conflito com o estado atual (409: e-mail repetido, marca que
 * já não está pendente, vínculo que impede a operação...).
 */

/** O recurso pedido não existe. Vira 404 com a mensagem `<recurso> não encontrado`. */
export class RecursoNaoEncontrado extends Error {
  constructor(readonly recurso: string) {
    super(`${recurso} não encontrado`);
    this.name = "RecursoNaoEncontrado";
  }
}

/** A operação conflita com o estado atual. Vira 409 com a própria mensagem (já pensada para o usuário). */
export class ConflitoDeNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ConflitoDeNegocio";
  }
}

/** A pessoa está autenticada mas não pode fazer ISTO (ex.: senha atual incorreta). Vira 403 com a própria mensagem. */
export class OperacaoNaoAutorizada extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "OperacaoNaoAutorizada";
  }
}
