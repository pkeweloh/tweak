FROM node:16-bullseye

WORKDIR /app

# Copia package.json primero
COPY tweak-backend/package*.json ./

RUN npm install

# Copia el resto del backend
COPY tweak-backend/ .

# Expone el puerto por defecto de Nest
EXPOSE 1337

# Comando para entorno de desarrollo
CMD ["npm", "run", "start:dev"]
