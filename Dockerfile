# Etapa de construcción
FROM node:20-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Construir el proyecto TypeScript
RUN npm run build

# Etapa de producción
FROM node:20-slim

WORKDIR /app

# Copiar solo lo necesario desde la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Exponer el puerto (Render lo detectará automáticamente o usará la variable PORT)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
