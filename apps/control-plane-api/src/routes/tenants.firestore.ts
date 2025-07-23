/**
 * Updated Tenants API Routes สำหรับ Firestore
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TenantService } from "../services/firestore.service";
import { TenantDocument } from "../types/firestore";

export default async function tenantRoutes(fastify: FastifyInstance) {
  // GET /api/tenants - ดึงรายการ tenants ทั้งหมด
  fastify.get(
    "/tenants",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as {
          page?: string;
          pageSize?: string;
        };

        const page = parseInt(query.page || "1", 10);
        const pageSize = parseInt(query.pageSize || "20", 10);

        const result = await TenantService.getAllTenants({ page, pageSize });

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error fetching tenants:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/tenants/:id - ดึงข้อมูล tenant ตาม ID
  fastify.get(
    "/tenants/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await TenantService.getTenant(id);

        if (!result.success) {
          return reply.code(404).send(result);
        }

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error fetching tenant:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // POST /api/tenants - สร้าง tenant ใหม่
  fastify.post(
    "/tenants",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenantData = request.body as Omit<
          TenantDocument,
          "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
        >;

        // TODO: รับ userId จาก JWT token
        const userId = "admin"; // Placeholder

        // สร้าง custom ID จากชื่อบริษัท
        const customId = tenantData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const result = await TenantService.createTenant(
          tenantData,
          userId,
          customId
        );

        if (!result.success) {
          return reply.code(400).send(result);
        }

        return reply.code(201).send(result);
      } catch (error) {
        console.error("Error creating tenant:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // PUT /api/tenants/:id - อัปเดต tenant
  fastify.put(
    "/tenants/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const updates = request.body as Partial<TenantDocument>;

        // TODO: รับ userId จาก JWT token
        const userId = "admin"; // Placeholder

        const result = await TenantService.updateTenant(id, updates, userId);

        if (!result.success) {
          return reply.code(400).send(result);
        }

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error updating tenant:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // DELETE /api/tenants/:id - ลบ tenant
  fastify.delete(
    "/tenants/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        const result = await TenantService.deleteTenant(id);

        if (!result.success) {
          return reply.code(404).send(result);
        }

        return reply.code(200).send(result);
      } catch (error) {
        console.error("Error deleting tenant:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );
}
