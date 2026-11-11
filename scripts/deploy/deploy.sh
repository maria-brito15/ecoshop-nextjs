#!/bin/sh
# =============================================================================
# DEPLOY - ECOSHOP (executa NO SERVIDOR; REQ-OPS-10)
# =============================================================================
# Publica a versão APP_TAG: baixa as imagens, aplica as migrations, sobe a app,
# verifica a saúde e, se a verificação falhar, volta à versão anterior.
#
# Uso (o job de deploy do CI faz isto por ssh):
#   APP_TAG=sha-1a2b3c4 ./deploy.sh
#
# Pré-requisitos no servidor, na mesma pasta deste script:
#   docker-compose.prod.yml e um .env com as variáveis obrigatórias
#   (ver o cabeçalho de docker-compose.prod.yml); curl instalado.
#
# Garantias e limites:
# - Qualquer comando que falhe aborta o script (set -e).
# - Se as migrations falharem, a app antiga NÃO é tocada.
# - A reversão troca só a imagem da app. Ela NÃO desfaz migrations: por isso toda
#   migration precisa ser compatível com a versão anterior da aplicação
#   (adicione antes de remover).
# - No primeiro deploy não há versão anterior: se a saúde falhar, o script sai
#   com erro e deixa a app como está, para inspeção.
# =============================================================================

set -eu

: "${APP_TAG:?defina APP_TAG com a tag da imagem, por exemplo sha-1a2b3c4}"

cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
ARQUIVO_TAG_ATUAL=.deploy/tag-atual
URL_SAUDE=http://127.0.0.1:3000/api/health
TENTATIVAS=12   # 12 tentativas x 5 s = 60 s, acima do start_period de 40 s do healthcheck
INTERVALO=5

mkdir -p .deploy
TAG_ANTERIOR=""
if [ -f "$ARQUIVO_TAG_ATUAL" ]; then
  TAG_ANTERIOR="$(cat "$ARQUIVO_TAG_ATUAL")"
fi

echo "==> 1/4 baixando as imagens ($APP_TAG)"
$COMPOSE pull app migrate

echo "==> 2/4 aplicando as migrations (a app antiga continua no ar)"
$COMPOSE run --rm migrate

echo "==> 3/4 subindo a aplicação nova"
$COMPOSE up -d --no-deps app

echo "==> 4/4 verificando a saúde em $URL_SAUDE"
saudavel=0
tentativa=0
while [ "$tentativa" -lt "$TENTATIVAS" ]; do
  if curl -fsS "$URL_SAUDE" >/dev/null 2>&1; then
    saudavel=1
    break
  fi
  tentativa=$((tentativa + 1))
  sleep "$INTERVALO"
done

if [ "$saudavel" -ne 1 ]; then
  echo "!! a aplicação não ficou saudável em $((TENTATIVAS * INTERVALO)) s" >&2
  if [ -n "$TAG_ANTERIOR" ]; then
    echo "!! revertendo para a versão anterior ($TAG_ANTERIOR)" >&2
    APP_TAG="$TAG_ANTERIOR" $COMPOSE up -d --no-deps app
  else
    echo "!! não há versão anterior para voltar (primeiro deploy)" >&2
  fi
  exit 1
fi

echo "$APP_TAG" > "$ARQUIVO_TAG_ATUAL"
docker image prune -f >/dev/null
echo "==> deploy concluído: $APP_TAG"
