-- Índices nas chaves estrangeiras usadas pelos filtros do catálogo (categoria, marca)
-- e pela consulta inversa de certificados. O Postgres não indexa FKs sozinho.
-- Gerado por `prisma migrate diff` e compatível com a versão anterior da aplicação
-- (só adiciona índices).

CREATE INDEX "produtos_categoria_id_idx" ON "produtos"("categoria_id");
CREATE INDEX "produtos_marca_id_idx" ON "produtos"("marca_id");
CREATE INDEX "produto_certificado_certificado_id_idx" ON "produto_certificado"("certificado_id");
