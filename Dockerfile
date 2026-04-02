# Pakai Node.js versi 18
FROM node:18-slim

# Install FFmpeg (Tanpa ini bot GAK BISA join call)
RUN apt-get update && apt-get install -y ffmpeg

# Set folder kerja
WORKDIR /app

# Copy daftar library dan instal
COPY package*.json ./
RUN npm install

# Copy semua file ke dalam server
COPY . .

# Jalankan botnya
CMD ["npm", "start"]
