# EcoShop — visão do produto

> Fonte: README original (intenção), código e respostas de Arthur em 2026-11-10. Onde há dúvida, está marcada como **pergunta aberta**.

## O que é
Uma **vitrine de produtos sustentáveis** com ferramentas educativas: o visitante navega no catálogo, conhece as certificações de cada produto e usa a IA para saber como descartar corretamente um resíduo (EcoScan) e tirar dúvidas (chat). Administradores mantêm o catálogo.

**Não é (por decisão do dono, 2026-11-10):** um e-commerce. **Fora de escopo:** carrinho, pedido, pagamento, estoque, entrega.

## Problema
Pessoas querem consumir e descartar com menos impacto ambiental, mas não sabem que produtos são confiáveis (certificações) nem como descartar cada material.

## Público e papéis
| Papel | Quem | Pode |
|---|---|---|
| Visitante | Qualquer pessoa | Ver catálogo, produto, educação, sobre; cadastrar-se; entrar |
| CLIENTE | Usuário cadastrado | Além do visitante: EcoScan, chat de IA, ver/editar o próprio perfil |
| MARCA | Representa uma marca | **Em definição.** Pode ser escolhido no cadastro **mediante aprovação de um ADMIN** (ainda não implementado: hoje o cadastro cria MARCA direto). O que a MARCA pode fazer além de CLIENTE: pergunta aberta |
| ADMIN | Equipe do EcoShop | Tudo, inclusive gerir produtos, categorias, marcas, certificados, fotos e usuários |

## Capacidades
Ver `docs/capabilities/README.md`.

## Perguntas abertas
1. O que um usuário MARCA pode fazer? (gerir os próprios produtos? só ser exibido?)
2. Fonte real das métricas da home e do "impacto" por produto (hoje ilustrativas; o dono quer fontes reais).
3. Quais materiais o modelo do Azure Custom Vision reconhece (hoje poucas tags, não documentadas).
4. O conteúdo de Educação deve ser editável pelo admin ou continua no código?
