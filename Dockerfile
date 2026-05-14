# --- stage 1: deps 
# instala apenas as dependências de produção e desenvolvimento necessárias para o build
# separar esse estágio evita reinstalar tudo quando só o código da aplicação muda
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

# --frozen-lockfile garante que o package-lock.json não seja atualizado silenciosamente
# isso torna o build reproduzível: qualquer desenvolvedor ou pipeline instala exatamente as mesmas versões
RUN npm ci --frozen-lockfile


# --- stage 2: builder 
# compila o next.js e gera os artefatos de produção (.next/)
# herda os node_modules do estágio anterior sem reinstalar
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# o prisma client é gerado a partir do schema.prisma e precisa existir antes do next build
# sem isso, o build quebra porque os imports de @prisma/client não resolvem
RUN npx prisma generate

# desativa a telemetria do next.js — sem esse flag, o build envia dados para a vercel em background
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# --- stage 3: runner 
# imagem final que vai para produção — a menor possível
# não carrega o código-fonte, só o que o next.js precisa para rodar
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# cria um usuário sem privilégios de root para rodar a aplicação
# rodar como root em container é um risco de segurança desnecessário
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# copia apenas os artefatos necessários para servir a aplicação
# node_modules vai junto porque o next start precisa de algumas dependências em runtime
COPY --from=builder /app/public         ./public
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/node_modules   ./node_modules
COPY --from=builder /app/package.json   ./package.json

# --chown garante que o usuário nextjs consegue ler os artefatos compilados
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# troca para o usuário sem privilégios antes de qualquer instrução que execute código
USER nextjs

EXPOSE 3000

# 0.0.0.0 faz o servidor escutar em todas as interfaces de rede do container
# sem isso, o servidor sobe em 127.0.0.1 e fica inacessível de fora do container
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]