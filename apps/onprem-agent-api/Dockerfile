# --- Stage 1: Build Stage ---
# ใช้ Node.js เวอร์ชั่น LTS (Long-Term Support) เป็นพื้นฐาน
FROM node:22-alpine AS builder

# กำหนด pnpm version
ARG PNPM_VERSION=10

# ติดตั้ง pnpm
RUN npm install -g pnpm@${PNPM_VERSION}

# กำหนด Working Directory ภายใน Container
WORKDIR /app

# Copy ไฟล์ที่จำเป็นสำหรับการติดตั้ง dependencies เท่านั้น
# นี่คือเทคนิคการทำ caching layer ของ Docker
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema
COPY prisma ./prisma

# ติดตั้ง dependencies ทั้งหมด
RUN pnpm install --frozen-lockfile

# Copy โค้ดทั้งหมดของโปรเจกต์เข้ามา
COPY . .

# รัน prisma generate อีกครั้งภายใน container เพื่อให้แน่ใจว่ามี client ที่ถูกต้อง
RUN pnpm exec prisma generate

# Build TypeScript เป็น JavaScript
RUN pnpm exec tsc

# --- Stage 2: Production Stage ---
# ใช้ base image ที่เล็กและปลอดภัยกว่าเดิม
FROM node:22-alpine AS production

WORKDIR /app

# Copy เฉพาะไฟล์ที่จำเป็นสำหรับการรันจาก builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy generated prisma client ที่ build แล้ว
COPY --from=builder /app/dist/generated/prisma-client ./dist/generated/prisma-client
COPY --from=builder /app/prisma ./prisma

# Copy ไฟล์ config.json ที่เราใช้เป็นตัวอย่าง
COPY --from=builder /app/dist/config.json ./dist/config.json

# เปิด Port 3001
EXPOSE 3001

# คำสั่งที่จะรันเมื่อ container เริ่มทำงาน
CMD ["node", "dist/index.js"]