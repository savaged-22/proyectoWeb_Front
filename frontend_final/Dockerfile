# Etapa 1: Build de Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
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
