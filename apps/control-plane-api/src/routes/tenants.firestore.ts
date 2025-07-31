/**
 * Updated Tenants API Routes สำหรับ Firestore
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { TenantService } from "../services/firestore.service";
import { TenantDocument } from "../types/firestore";
import { UniversalXmlParser } from "../services/xml-parser.service.js";
import { db } from "../config/firebase-real.js";

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

  // POST /api/tenants/:id/upload-xml - อัปโหลดไฟล์ XML สำหรับ tenant
  fastify.post(
    "/tenants/:id/upload-xml",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id: tenantId } = request.params as { id: string };

        // Handle both multipart form data and JSON body
        let xmlContent: string;
        let fileName = "uploaded.xml";

        // For now, only handle JSON body (multipart support can be added later)
        const body = request.body as { xmlContent?: string; fileName?: string };
        if (!body.xmlContent || typeof body.xmlContent !== "string") {
          return reply.code(400).send({
            success: false,
            error: "xmlContent is required and must be a string",
            timestamp: new Date().toISOString(),
          });
        }
        xmlContent = body.xmlContent;
        fileName = body.fileName || "inventory_data.xml";

        // ตรวจสอบว่า tenant มีอยู่จริง
        const tenantResult = await TenantService.getTenant(tenantId);
        if (!tenantResult.success) {
          return reply.code(404).send({
            success: false,
            error: "Tenant not found",
            timestamp: new Date().toISOString(),
          });
        }

        // Parse XML using Universal Parser
        try {
          const parseResult = await UniversalXmlParser.parse(xmlContent, {
            maxRecords: 100, // Limit for initial analysis
            skipEmptyFields: true,
            normalizeFieldNames: false,
          });

          console.log(`[Control Plane] XML uploaded for tenant: ${tenantId}`);
          console.log(`[Control Plane] File: ${fileName}`);
          console.log(
            `[Control Plane] Structure: ${parseResult.detectedStructure}`
          );
          console.log(`[Control Plane] Records: ${parseResult.totalRecords}`);
          console.log(
            `[Control Plane] Columns: ${parseResult.availableColumns.length}`
          );

          // Store parsed result in Firestore for quick access
          await db
            .collection("tenants")
            .doc(tenantId)
            .collection("uploads")
            .doc("latest")
            .set({
              fileName,
              uploadedAt: new Date().toISOString(),
              fileSize: Buffer.byteLength(xmlContent, "utf8"),
              detectedStructure: parseResult.detectedStructure,
              rootElement: parseResult.rootElement,
              recordElement: parseResult.recordElement,
              totalRecords: parseResult.totalRecords,
              availableColumns: parseResult.availableColumns,
              sampleRecords: parseResult.records.slice(0, 5), // Store sample for preview
              // Store full content for now (in production, might want to use Cloud Storage)
              xmlContent:
                xmlContent.length > 1000000
                  ? "Too large to store inline"
                  : xmlContent,
            });

          return reply.code(200).send({
            success: true,
            message: "XML file parsed and stored successfully",
            fileName,
            fileSize: Buffer.byteLength(xmlContent, "utf8"),
            uploadedAt: new Date().toISOString(),
            tenantId,
            parseResult: {
              detectedStructure: parseResult.detectedStructure,
              rootElement: parseResult.rootElement,
              recordElement: parseResult.recordElement,
              totalRecords: parseResult.totalRecords,
              availableColumns: parseResult.availableColumns,
              sampleRecords: parseResult.records.slice(0, 5),
            },
          });
        } catch (parseError) {
          console.error("XML Parse Error:", parseError);
          return reply.code(400).send({
            success: false,
            error: "Failed to parse XML file",
            details:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error uploading XML:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/tenants/:id/sample-xml - ส่ง sample XML structure
  fastify.get(
    "/tenants/:id/sample-xml",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<InventoryData>
  <Products>
    <Product ID="P001" Code="SKU001" Name="Product Alpha" Category="Electronics" UnitCost="1500" />
    <Product ID="P002" Code="SKU002" Name="Product Beta" Category="Hardware" UnitCost="2500" />
    <Product ID="P003" Code="SKU003" Name="Product Gamma" Category="Electronics" UnitCost="800" />
  </Products>
  
  <StockItems>
    <Item ProductID="P001" Lot="LOT001" ReceivedDate="2024-01-15" ExpiryDate="2025-01-15" Quantity="100" UnitCost="1500" />
    <Item ProductID="P001" Lot="LOT002" ReceivedDate="2024-02-01" ExpiryDate="2024-12-31" Quantity="50" UnitCost="1500" />
    <Item ProductID="P002" Lot="LOT003" ReceivedDate="2024-01-20" ExpiryDate="2025-06-20" Quantity="75" UnitCost="2500" />
    <Item ProductID="P003" Lot="LOT004" ReceivedDate="2024-03-01" ExpiryDate="2024-11-30" Quantity="200" UnitCost="800" />
  </StockItems>
  
  <ConsumptionHistory>
    <Monthly Month="2024-01" Consumption="125000" ItemsCount="15" />
    <Monthly Month="2024-02" Consumption="98000" ItemsCount="12" />
    <Monthly Month="2024-03" Consumption="156000" ItemsCount="18" />
    <Monthly Month="2024-04" Consumption="134000" ItemsCount="16" />
    <Monthly Month="2024-05" Consumption="189000" ItemsCount="22" />
    <Monthly Month="2024-06" Consumption="167000" ItemsCount="20" />
  </ConsumptionHistory>
</InventoryData>`;

      reply.type("application/xml");
      return reply.code(200).send(sampleXML);
    }
  );

  // GET /api/tenants/:id/data-status - ตรวจสอบสถานะข้อมูล XML
  fastify.get(
    "/tenants/:id/data-status",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id: tenantId } = request.params as { id: string };

        // ตรวจสอบว่า tenant มีอยู่จริง
        const tenantResult = await TenantService.getTenant(tenantId);
        if (!tenantResult.success) {
          return reply.code(404).send({
            success: false,
            error: "Tenant not found",
            timestamp: new Date().toISOString(),
          });
        }

        // ตรวจสอบข้อมูล XML ใน Firestore
        try {
          const uploadDoc = await db
            .collection("tenants")
            .doc(tenantId)
            .collection("uploads")
            .doc("latest")
            .get();

          if (uploadDoc.exists) {
            const uploadData = uploadDoc.data();
            return reply.code(200).send({
              hasData: true,
              message: "XML data available",
              metadata: {
                fileName: uploadData?.fileName,
                uploadedAt: uploadData?.uploadedAt,
                totalRecords: uploadData?.totalRecords,
                availableColumns: uploadData?.availableColumns,
                detectedStructure: uploadData?.detectedStructure,
              },
              timestamp: new Date().toISOString(),
            });
          } else {
            return reply.code(200).send({
              hasData: false,
              message:
                "No XML data file found. Please upload inventory data first.",
              uploadPath: `/tenants/${tenantId}/upload`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          return reply.code(200).send({
            hasData: false,
            message: "Unable to check data status. Please try uploading again.",
            uploadPath: `/tenants/${tenantId}/upload`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error checking data status:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /api/tenants/:id/data - ดึงข้อมูล XML ที่ upload ไว้
  fastify.get(
    "/tenants/:id/data",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id: tenantId } = request.params as { id: string };
        const { columns, limit } = request.query as {
          columns?: string;
          limit?: string;
        };

        // ตรวจสอบว่า tenant มีอยู่จริง
        const tenantResult = await TenantService.getTenant(tenantId);
        if (!tenantResult.success) {
          return reply.code(404).send({
            success: false,
            error: "Tenant not found",
            timestamp: new Date().toISOString(),
          });
        }

        // ดึงข้อมูล XML จาก Firestore
        try {
          const uploadDoc = await db
            .collection("tenants")
            .doc(tenantId)
            .collection("uploads")
            .doc("latest")
            .get();

          if (!uploadDoc.exists) {
            return reply.code(404).send({
              success: false,
              error: "No XML data found. Please upload data first.",
              data: [],
              totalRecords: 0,
              availableColumns: [],
              timestamp: new Date().toISOString(),
            });
          }

          const uploadData = uploadDoc.data();

          // If we have full XML content, re-parse it to get all records
          let records = uploadData?.sampleRecords || [];
          let totalRecords = uploadData?.totalRecords || records.length;

          if (
            uploadData?.xmlContent &&
            uploadData.xmlContent !== "Too large to store inline"
          ) {
            try {
              // Re-parse full XML to get all records
              const parseResult = await UniversalXmlParser.parse(
                uploadData.xmlContent,
                {
                  maxRecords: 1000, // Increase limit for API calls
                  skipEmptyFields: true,
                  normalizeFieldNames: false,
                }
              );

              records = parseResult.records;
              totalRecords = parseResult.totalRecords;

              console.log(
                `[Control Plane API] Re-parsed XML: ${totalRecords} records`
              );
            } catch (parseError) {
              console.warn(
                "Failed to re-parse XML, using sample records:",
                parseError
              );
              // Fall back to sample records
            }
          }

          // Filter columns if specified
          if (columns && records.length > 0) {
            const selectedColumns = columns.split(",").map((c) => c.trim());
            records = records.map((record: any) => {
              const filtered: any = {};
              selectedColumns.forEach((col) => {
                if (record[col] !== undefined) {
                  filtered[col] = record[col];
                }
              });
              return filtered;
            });
          }

          // Apply limit
          const limitNum = limit ? parseInt(limit, 10) : undefined;
          if (limitNum && limitNum > 0) {
            records = records.slice(0, limitNum);
          }

          return reply.code(200).send({
            success: true,
            data: records,
            records: records, // Alternative field name
            totalRecords: totalRecords,
            availableColumns: uploadData?.availableColumns || [],
            metadata: {
              tenantId,
              source: "xml_upload",
              fileName: uploadData?.fileName,
              uploadedAt: uploadData?.uploadedAt,
              detectedStructure: uploadData?.detectedStructure,
              filteredColumns: columns
                ? columns.split(",").map((c) => c.trim())
                : null,
              limit: limitNum,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          return reply.code(500).send({
            success: false,
            error: "Failed to retrieve data from storage",
            message:
              firestoreError instanceof Error
                ? firestoreError.message
                : "Storage error",
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error fetching XML data:", error);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );
}
