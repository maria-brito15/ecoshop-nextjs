# =============================================================================
# DOCKERFILE - ECOSHOP (MULTI-STAGE BUILD)
# =============================================================================
# Dockerfile multi-stage para otimizar o tamanho da imagem final e a segurança.
#
# Estágios:
# 1. deps      - Instala dependências (incluindo devDependencies)
# 2. builder   - Compila a aplicação Next.js
# 3. runner    - Imagem final de produção (mínima e segura)
# 4. migrator  - Estágio separado para migrações de banco de dados
#
# Por que multi-stage?
# - Imagem final não contém ferramentas de build (Node.js é suficiente)
# - Reduz drasticamente o tamanho da imagem (de ~1GB para ~200MB)
# - Melhora segurança (remove devDependencies, source maps, etc.)
# =============================================================================

# -----------------------------------------------------------------------------
# ESTÁGIO 1: DEPENDÊNCIAS
# -----------------------------------------------------------------------------
# Instala todas as dependências (incluindo devDependencies)
# Usado pelo estágio builder para compilar a aplicação
FROM node:22-alpine AS deps

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de manifesto de dependências
# Separado em COPY layers para aproveitar cache do Docker
COPY package.json package-lock.json ./

# Instala todas as dependências (incluindo devDependencies como TypeScript)
# --frozen-lockfile: garante que package-lock.json não seja modificado
RUN npm ci --frozen-lockfile

# -----------------------------------------------------------------------------
# ESTÁGIO 2: BUILDER (COMPILAÇÃO)
# -----------------------------------------------------------------------------
# Compila a aplicação Next.js para produção
FROM node:22-alpine AS builder

WORKDIR /app

# Copia as dependências já instaladas do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia o código fonte da aplicação
COPY . .

# Define variáveis de ambiente para o build
# NEXT_PUBLIC_* são embutidas no bundle do cliente
ENV NEXT_PUBLIC_SITE_URL=""

# Gera o cliente Prisma a partir do schema
# Necessário antes da compilação para o TypeScript reconhecer os tipos
RUN npx prisma generate

# Compila a aplicação Next.js
# Saída: .next/ (standalone mode com standalone output)
RUN npm run build

# -----------------------------------------------------------------------------
# ESTÁGIO 3: RUNNER (PRODUÇÃO)
# -----------------------------------------------------------------------------
# Imagem final de produção - mínima e otimizada
FROM node:22-alpine AS runner

WORKDIR /app

# Configurações de ambiente para produção
ENV NODE_ENV=production
# Desativa telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root para segurança
# node:22-alpine já vem com usuário 'node' (UID 1000)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos estáticos públicos (acessíveis via /public)
COPY --from=builder /app/public ./public

# Copia o build do Next.js (standalone mode)
# O standalone output inclui todas as dependências necessárias
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia o cliente Prisma e o schema para execução em produção
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copia o script de entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Alterna para o usuário não-root
USER nextjs

# Porta exposta pelo Next.js
EXPOSE 3000

# Healthcheck para verificar se a aplicação está respondendo
# Verifica a cada 30 segundos, timeout de 10 segundos, 3 falhas consecutivas = unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Entrypoint que executa migrações antes de iniciar o servidor
ENTRYPOINT ["./docker-entrypoint.sh"]

# Comando padrão: inicia o servidor Next.js
# O host 0.0.0.0 é necessário para aceitar conexões externas
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# ESTÁGIO 4: MIGRATOR (MIGRAÇÕES DE BANCO)
# -----------------------------------------------------------------------------
# Estágio separado para executar migrações do Prisma
# Útil em pipelines de CI/CD e docker-compose para garantir schema atualizado
FROM node:22-alpine AS migrator

WORKDIR /app

# Copia dependências e código fonte
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o cliente Prisma
RUN npx prisma generate

# Comando padrão: executa migrações
# Pode ser sobrescrito no docker-compose se necessário
CMD ["npx", "prisma", "migrate", "deploy"]