FROM node:20-slim

WORKDIR /app

# Instalar dependencias primero (mejor cache de Docker)
COPY package.json package-lock.json* ./
RUN npm install

# Copiar todo el código fuente (incluye public/images/)
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
