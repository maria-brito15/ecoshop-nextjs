-- ADR-0018: status de aprovação de cadastro MARCA fica na Marca.
-- CreateEnum
CREATE TYPE "StatusMarca" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- AlterTable
-- Default temporário 'APROVADA' faz o Postgres preencher as linhas já
-- existentes como aprovadas (preserva o catálogo atual); o próximo passo
-- troca o default para PENDENTE, que é o que o código usa ao criar um
-- pedido de marca a partir do cadastro público.
ALTER TABLE "marcas" ADD COLUMN "status" "StatusMarca" NOT NULL DEFAULT 'APROVADA';
ALTER TABLE "marcas" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
