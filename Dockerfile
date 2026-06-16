# syntax=docker/dockerfile:1

# ---------- Estágio 1: build do frontend ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências primeiro (camada cacheável)
COPY package.json package-lock.json ./
RUN npm ci

# Copia o código e gera o build estático
COPY . .

# URL relativa: o front chama "/api" e o Nginx faz proxy para o backend real.
# Assim o bundle fica genérico — a mesma imagem roda em qualquer ambiente.
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ---------- Estágio 2: runtime (Nginx servindo estático + proxy /api) ----------
FROM nginx:1.27-alpine AS runner

# O nginx:alpine aplica envsubst nos arquivos de /etc/nginx/templates/*.template
# ao iniciar, gerando /etc/nginx/conf.d/*.conf. É assim que ${BACKEND_URL}
# é injetado em runtime — sem rebuildar a imagem.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Artefatos estáticos do build
COPY --from=builder /app/dist /usr/share/nginx/html

# Backend padrão (sobrescreva com -e BACKEND_URL=http://seu-back:3000).
# host.docker.internal => backend rodando na máquina host (Docker Desktop).
ENV BACKEND_URL=http://host.docker.internal:3000

EXPOSE 80

# O entrypoint padrão da imagem nginx já roda o envsubst e sobe o servidor.
