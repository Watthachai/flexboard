/**
 * Data Columns API - จัดเก็บและดึงข้อมูล columns จาก XML uploads
 * สำหรับใช้ใน Dashboard-as-Code editor
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { FirestoreService } from "../services/firestore.service";

interface ColumnData {
  tenantId: string;
  columns: string[];
  sampleData: any[];
  metadata: {
    totalRows: number;
    extractedAt: string;
    dashboardName?: string;
    fileName?: string;
    fileSize?: number;
  };
}

interface DataColumnsRouteParams {
  tenantId: string;
}

interface DataColumnsBody {
  columns: string[];
  sampleData: any[];
  metadata: {
    totalRows: number;
    extractedAt: string;
    dashboardName?: string;
    fileName?: string;
    fileSize?: number;
  };
}

export default async function dataColumnsRoutes(fastify: FastifyInstance) {
  // POST /api/tenants/:tenantId/data-columns - บันทึก column ข้อมูล
  fastify.post<{
    Params: DataColumnsRouteParams;
    Body: DataColumnsBody;
  }>("/api/tenants/:tenantId/data-columns", async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const { columns, sampleData, metadata } = request.body;

      if (!columns || !Array.isArray(columns)) {
        return reply.status(400).send({
          success: false,
          error: "Invalid columns data",
        });
      }

      const columnData: ColumnData = {
        tenantId,
        columns,
        sampleData: sampleData || [],
        metadata: {
          ...metadata,
          extractedAt: new Date().toISOString(),
        },
      };

      // บันทึกข้อมูลใน Firestore
      const result = await FirestoreService.createDocument(
        "data-columns",
        columnData,
        "system", // userId
        tenantId // customId - ใช้ tenantId เป็น document ID
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to save column data");
      }

      return reply.send({
        success: true,
        message: "Column data saved successfully",
        data: {
          id: tenantId,
          columns: columns.length,
          sampleRows: sampleData?.length || 0,
        },
      });
    } catch (error) {
      console.error("Error saving column data:", error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // GET /api/tenants/:tenantId/data-columns - ดึงข้อมูล columns
  fastify.get<{
    Params: DataColumnsRouteParams;
  }>("/api/tenants/:tenantId/data-columns", async (request, reply) => {
    try {
      const { tenantId } = request.params;

      const result = await FirestoreService.getDocument(
        "data-columns",
        tenantId
      );

      if (!result.success) {
        if (result.error?.includes("not found")) {
          return reply.send({
            success: true,
            data: {
              columns: [],
              sampleData: [],
              metadata: null,
            },
          });
        }
        throw new Error(result.error || "Failed to fetch column data");
      }

      return reply.send({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error("Error fetching column data:", error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // DELETE /api/tenants/:tenantId/data-columns - ลบข้อมูล columns
  fastify.delete<{
    Params: DataColumnsRouteParams;
  }>("/api/tenants/:tenantId/data-columns", async (request, reply) => {
    try {
      const { tenantId } = request.params;

      const result = await FirestoreService.deleteDocument(
        "data-columns",
        tenantId
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to delete column data");
      }

      return reply.send({
        success: true,
        message: "Column data deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting column data:", error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });
}
