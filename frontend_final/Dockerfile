# ════════════════════════════════════════════════════
# Etapa 1: Build de Angular (SSR)
# ════════════════════════════════════════════════════
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias primero para aprovechar caché
COPY package*.json ./
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Compilar Angular en modo producción (SSR incluido)
RUN npm run build -- --configuration production

# ════════════════════════════════════════════════════
# Etapa 2: Runtime (Node para SSR)
# ════════════════════════════════════════════════════
FROM node:20-alpine

WORKDIR /app

# Copiar el output del build
COPY --from=build /app/dist/frontend_final ./dist/frontend_final

# Puerto en que escucha el servidor SSR de Angular
EXPOSE 4000

# Producción
ENV NODE_ENV=production

# Arrancar el servidor SSR
CMD ["node", "dist/frontend_final/server/server.mjs"]
