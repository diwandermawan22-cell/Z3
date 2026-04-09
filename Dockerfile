# Gunakan Node.js 20 agar sesuai dengan engine di package.json
FROM node:20-slim

# Install alat masak (compiler) dan ffmpeg untuk audio
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json dulu biar cache cepat
COPY package*.json ./

# Install semua library
RUN npm install

# Copy sisa file bot
COPY . .

# Jalankan botnya
CMD ["node", "index.js"]
