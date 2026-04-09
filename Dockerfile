FROM node:20-slim

# Install library sistem untuk audio dan build
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
# Menggunakan --include=dev karena beberapa library audio butuh build tool
RUN npm install

COPY . .

CMD ["node", "index.js"]
