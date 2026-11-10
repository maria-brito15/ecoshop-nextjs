# MIDIA · Mídia de produto (fotos)

> Spec viva. Fonte de verdade do comportamento esperado. Última revisão: 2026-11-10. ADRs: ADR-0011

## Objetivo

Permitir que ADMIN anexe e remova fotos de um produto, guardadas no banco, e que a vitrine as exiba.

## Atores

ADMIN (escrita) · todos (leitura).

## Regras de negócio

- **BR-MIDIA-01** — A foto é guardada no banco como bytes e servida por URL da própria API (ADR-0011).
- **BR-MIDIA-02** — Cada produto tem no máximo uma foto principal.

## Requisitos

| ID | Requisito (EARS) | Aceitação |
|---|---|---|
| REQ-MIDIA-01 | Quando um ADMIN envia uma imagem válida para um produto, o sistema deve guardá-la e torná-la acessível por URL. | POST em /api/produtos/[id]/fotos → 201 e GET da URL devolve a imagem |
| REQ-MIDIA-02 | Se o arquivo enviado não é imagem permitida ou excede o limite de tamanho, o sistema deve recusá-lo com 400. | Arquivo .txt → 400; arquivo acima do limite → 400 |
| REQ-MIDIA-03 | Quando um ADMIN remove uma foto, o sistema deve apagá-la e deixar de exibi-la. | DELETE → 200 e a URL passa a responder 404 |
| REQ-MIDIA-04 | Quando o produto tem várias fotos, o sistema deve exibir a galeria na página do produto. | Produto com 3 fotos mostra 3 miniaturas |

## Casos-limite

Fotos no banco aumentam seu tamanho e o custo de backup (NFR-DES-01 a verificar). Troca da foto principal não está especificada.

## Interfaces

/api/produtos/[id]/fotos (+ subrotas) · painel (aba Produtos).

## NFRs aplicáveis

NFR-DES-01.

## Fora de escopo

Redimensionamento automático; CDN.

## Perguntas abertas

1. Foto no banco continua adequada, ou migrar para armazenamento de objetos (revisar ADR-0011)?
2. A galeria (REQ-MIDIA-04) é desejada?
