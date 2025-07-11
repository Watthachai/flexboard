// apps/onprem-agent-api/src/index.ts
import Fastify from "fastify";
import { PrismaClient } from "../src/generated/prisma-client";
import fs from "fs/promises";
import path from "path";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// สร้างไฟล์ config.json ตัวอย่างสำหรับการทดสอบ
const createSampleConfig = async () => {
  const sampleConfig = {
    "sales-by-month": {
      query:
        "SELECT FORMAT(OrderDate, 'yyyy-MM') AS month, SUM(TotalDue) AS total_sales FROM Sales.SalesOrderHeader GROUP BY FORMAT(OrderDate, 'yyyy-MM') ORDER BY month",
    },
  };
  try {
    await fs.writeFile(
      path.join(__dirname, "config.json"),
      JSON.stringify(sampleConfig, null, 2)
    );
    fastify.log.info("Sample config.json created.");
  } catch (error) {
    fastify.log.error(error, "Failed to create sample config.json");
  }
};

// API Endpoint หลัก
fastify.get("/api/data/:widgetId", async (request, reply) => {
  try {
    const { widgetId } = request.params as { widgetId: string };

    // 1. อ่านไฟล์ config.json
    const configPath = path.join(__dirname, "config.json");
    const configFile = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configFile);

    const widgetConfig = config[widgetId];
    if (!widgetConfig || !widgetConfig.query) {
      return reply
        .status(404)
        .send({ error: "Widget configuration not found" });
    }

    // 2. รัน Raw Query ด้วย Prisma
    const data = await prisma.$queryRawUnsafe(widgetConfig.query);

    // 3. ส่งข้อมูลกลับไป
    return reply.send(data);
  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
});

const start = async () => {
  try {
    await createSampleConfig(); // สร้างไฟล์ config ตอนเริ่ม
    await fastify.listen({ port: 3001 }); // Agent API รันที่ Port 3001
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
