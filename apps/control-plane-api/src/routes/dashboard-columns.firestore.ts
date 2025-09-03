/**
 * Dashboard Columns Management Routes
 * Handles saving and retrieving column configurations for dashboards
 */

import { FastifyInstance } from "fastify";
import { TenantService } from "../services/firestore.service";
import { db, isFirebaseAvailable, getFirebaseUnavailableError } from "../config/firebase-real";

interface ColumnSaveRequest {
  columns: string[];
}

interface ColumnResponse {
  columns: string[];
  savedAt: string;
}

export default async function dashboardColumnsRoutes(fastify: FastifyInstance) {
  // Get saved columns for a dashboard
  fastify.get<{
    Params: { id: string; dashboardId: string };
  }>("/tenants/:id/dashboards/:dashboardId/columns", async (request, reply) => {
    try {
      if (!isFirebaseAvailable()) {
        return reply.code(503).send(getFirebaseUnavailableError());
      }

      const { id: tenantId, dashboardId } = request.params;

      // Verify tenant exists
      const tenantResult = await TenantService.getTenant(tenantId);
      if (!tenantResult.success) {
        return reply.code(404).send({
          error: "Tenant not found",
          tenantId,
        });
      }

      // Get saved columns from Firestore
      const columnsDoc = await db!
        .collection("tenants")
        .doc(tenantId)
        .collection("dashboards")
        .doc(dashboardId)
        .collection("metadata")
        .doc("columns")
        .get();

      const response: ColumnResponse = {
        columns: columnsDoc.exists
          ? (columnsDoc.data()?.columns as string[]) || []
          : [],
        savedAt: columnsDoc.exists
          ? (columnsDoc.data()?.savedAt as string) || ""
          : "",
      };

      reply.send(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      fastify.log.error(`Error fetching dashboard columns: ${errorMessage}`);
      reply.code(500).send({
        error: "Failed to fetch dashboard columns",
        details: errorMessage,
      });
    }
  });

  // Save columns for a dashboard
  fastify.post<{
    Params: { id: string; dashboardId: string };
    Body: ColumnSaveRequest;
  }>("/tenants/:id/dashboards/:dashboardId/columns", async (request, reply) => {
    try {
      if (!isFirebaseAvailable()) {
        return reply.code(503).send(getFirebaseUnavailableError());
      }

      const { id: tenantId, dashboardId } = request.params;
      const { columns } = request.body;

      // Validate request
      if (!Array.isArray(columns)) {
        return reply.code(400).send({
          error: "Invalid request format",
          message: "columns must be an array of strings",
        });
      }

      // Verify tenant exists
      const tenantResult = await TenantService.getTenant(tenantId);
      if (!tenantResult.success) {
        return reply.code(404).send({
          error: "Tenant not found",
          tenantId,
        });
      }

      // Save columns to Firestore
      const now = new Date().toISOString();

      await db!
        .collection("tenants")
        .doc(tenantId)
        .collection("dashboards")
        .doc(dashboardId)
        .collection("metadata")
        .doc("columns")
        .set({
          columns,
          savedAt: now,
          updatedAt: now,
        });

      const response: ColumnResponse = {
        columns,
        savedAt: now,
      };

      fastify.log.info(
        `Saved ${columns.length} columns for dashboard ${dashboardId} in tenant ${tenantId}`
      );
      reply.send(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      fastify.log.error(`Error saving dashboard columns: ${errorMessage}`);
      reply.code(500).send({
        error: "Failed to save dashboard columns",
        details: errorMessage,
      });
    }
  });
}
