# ================================
# Dev Image
# ================================
FROM node:23-alpine AS dev
WORKDIR /app
COPY package*.json /app/
RUN npm install -g npm@latest
RUN npm install -g @vue/cli@latest
RUN npm install --production=false
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
