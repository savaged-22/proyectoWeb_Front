# Etapa 1: Build de Angular
FROM node:20-alpine AS build
WORKDIR /app

# Copiar dependencias primero para aprovechar caché.
# Usamos `npm install` (no `npm ci`) para tolerar pequeñas desincronizaciones
# del lock generadas cuando el dev local usa otra versión de Node.
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copiar el resto del proyecto
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Runtime con Nginx
FROM nginx:1.27-alpine
# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiar el output del build (archivos estáticos)
COPY --from=build /app/dist/frontend_final/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
