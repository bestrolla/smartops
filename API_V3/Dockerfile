FROM node:20-slim

WORKDIR /usr/src/app

# Copia solo lo necesario para instalar dependencias
COPY package*.json ./

# Instala dependencias de producción (ignora devDependencies)
RUN npm install --production

# Copia el resto del código
COPY . .

# Puerto expuesto
EXPOSE 8080

# Comando de inicio
CMD ["npm", "start"]