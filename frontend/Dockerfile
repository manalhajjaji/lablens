# 1. Utiliser une image Node.js légère (la version doit correspondre à ton projet)
FROM node:18-alpine

# 2. Créer le dossier de travail dans le conteneur
WORKDIR /app

# 3. Copier les fichiers de configuration des dépendances
COPY package.json package-lock.json* ./

# 4. Installer les dépendances
# (C'est ici que 'npm install' se lance automatiquement à la construction)
RUN npm install

# 5. Copier tout le reste du code frontend dans le conteneur
COPY . .

# 6. Ouvrir le port 3000 (standard pour Next.js)
EXPOSE 3000

# 7. Lancer le serveur de développement
CMD ["npm", "run", "dev"]