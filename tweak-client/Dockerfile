FROM node:16-bullseye

# Instala Angular CLI globalmente
RUN npm install -g @angular/cli@13.2.4

WORKDIR /app

# Copia package.json primero para aprovechar cache
COPY tweak-client/package*.json ./

RUN npm install

# Copia el resto del proyecto
COPY tweak-client/ .

# Expone el puerto de Angular
EXPOSE 4200

# Comando para desarrollo
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "1000", "--disable-host-check"]
