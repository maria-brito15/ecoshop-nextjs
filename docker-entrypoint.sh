#!/bin/sh
# =============================================================================
# DOCKER ENTRYPOINT - ECOSHOP
# =============================================================================

set -e

echo "⏳ Aguardando PostgreSQL ficar disponível..."

while ! nc -z postgres 5432; do
  sleep 1
done

echo "✅ PostgreSQL está disponível!"

echo "⏳ Aguardando Redis ficar disponível..."

while ! nc -z redis 6379; do
  sleep 1
done

echo "✅ Redis está disponível!"

# Verifica se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERRO: DATABASE_URL não está configurada!"
  exit 1
fi

echo "📦 DATABASE_URL configurada"

# NOTA: prisma generate é executado durante o build (estágio builder no Dockerfile)
# NOTA: prisma migrate deploy é executado pelo serviço 'migrate' no docker-compose
# Não é necessário repetir essas operações aqui

echo "🚀 Iniciando aplicação..."

exec "$@"