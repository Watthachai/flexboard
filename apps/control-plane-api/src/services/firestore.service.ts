/**
 * Firestore Service
 * เป็นตัวกลางในการจัดการข้อมูลใน Firestore
 */

import {
  CollectionReference,
  DocumentReference,
  QuerySnapshot,
  Timestamp,
  FieldValue,
  Query,
} from "firebase-admin/firestore";
import { db, COLLECTIONS } from "../config/firebase-real";
import {
  BaseDocument,
  TenantDocument,
  DashboardDocument,
  WidgetDocument,
  ApiResponse,
  PaginatedResponse,
} from "../types/firestore";

// ===== Generic Firestore Operations =====
export class FirestoreService {
  // สร้าง Document ใหม่
  static async createDocument<T extends BaseDocument>(
    collection: string,
    data: Omit<T, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">,
    userId: string,
    customId?: string
  ): Promise<ApiResponse<T>> {
    try {
      const docRef = customId
        ? db.collection(collection).doc(customId)
        : db.collection(collection).doc();
      const now = Timestamp.now();

      const docData = {
        ...data,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      } as T;

      await docRef.set(docData);

      return {
        success: true,
        data: {
          ...docData,
          // Convert Firestore Timestamps to ISO strings
          createdAt: now.toDate().toISOString(),
          updatedAt: now.toDate().toISOString(),
        } as T,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // อ่าน Document
  static async getDocument<T extends BaseDocument>(
    collection: string,
    documentId: string
  ): Promise<ApiResponse<T>> {
    try {
      const docRef = db.collection(collection).doc(documentId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return {
          success: false,
          error: "Document not found",
          timestamp: new Date().toISOString(),
        };
      }

      const docData = doc.data();
      return {
        success: true,
        data: {
          id: doc.id,
          ...docData,
          // Convert Firestore Timestamps to ISO strings
          createdAt: docData?.createdAt
            ? docData.createdAt.toDate().toISOString()
            : new Date().toISOString(),
          updatedAt: docData?.updatedAt
            ? docData.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
        } as unknown as T,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting document from ${collection}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // อัปเดต Document
  static async updateDocument<T extends BaseDocument>(
    collection: string,
    documentId: string,
    updates: Partial<Omit<T, "id" | "createdAt" | "createdBy">>,
    userId: string
  ): Promise<ApiResponse<T>> {
    try {
      const docRef = db.collection(collection).doc(documentId);

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      };

      await docRef.update(updateData);

      // ดึงข้อมูลใหม่หลังจากอัปเดต
      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data();

      return {
        success: true,
        data: {
          id: updatedDoc.id,
          ...updatedData,
          // Convert Firestore Timestamps to ISO strings
          createdAt: updatedData?.createdAt
            ? updatedData.createdAt.toDate().toISOString()
            : new Date().toISOString(),
          updatedAt: updatedData?.updatedAt
            ? updatedData.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
        } as unknown as T,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ลบ Document
  static async deleteDocument(
    collection: string,
    documentId: string
  ): Promise<ApiResponse<void>> {
    try {
      const docRef = db.collection(collection).doc(documentId);
      await docRef.delete();

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error deleting document from ${collection}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ดึงข้อมูลแบบ Paginated
  static async getDocuments<T extends BaseDocument>(
    collection: string,
    options: {
      page?: number;
      pageSize?: number;
      orderBy?: { field: string; direction: "asc" | "desc" };
      where?: { field: string; operator: any; value: any }[];
    } = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      const { page = 1, pageSize = 20, orderBy, where } = options;

      let query: Query<any, any> = db.collection(collection);

      // Apply where conditions
      if (where && where.length > 0) {
        where.forEach((condition) => {
          query = query.where(
            condition.field,
            condition.operator,
            condition.value
          );
        });
      }

      // Apply ordering
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction);
      }

      // Apply pagination (simplified - just use limit for now)
      query = query.limit(pageSize);

      const snapshot = await query.get();
      const documents = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings
          createdAt: data.createdAt
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
          updatedAt: data.updatedAt
            ? data.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
        };
      }) as T[];

      // Count total documents (for pagination info)
      const countQuery = db.collection(collection);
      const countSnapshot = await countQuery.get();
      const total = countSnapshot.size || countSnapshot.docs?.length || 0;

      return {
        success: true,
        data: documents,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page * pageSize < total,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting documents from ${collection}:`, error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// ===== Specialized Services =====

// Tenant Service
export class TenantService extends FirestoreService {
  static async createTenant(
    tenantData: Omit<
      TenantDocument,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >,
    userId: string,
    customId?: string
  ) {
    return this.createDocument<TenantDocument>(
      COLLECTIONS.TENANTS,
      tenantData,
      userId,
      customId
    );
  }

  static async getTenant(tenantId: string) {
    return this.getDocument<TenantDocument>(COLLECTIONS.TENANTS, tenantId);
  }

  static async updateTenant(
    tenantId: string,
    updates: Partial<TenantDocument>,
    userId: string
  ) {
    return this.updateDocument<TenantDocument>(
      COLLECTIONS.TENANTS,
      tenantId,
      updates,
      userId
    );
  }

  static async deleteTenant(tenantId: string) {
    return this.deleteDocument(COLLECTIONS.TENANTS, tenantId);
  }

  static async getAllTenants(options?: { page?: number; pageSize?: number }) {
    return this.getDocuments<TenantDocument>(COLLECTIONS.TENANTS, options);
  }
}

// Dashboard Service
export class DashboardService extends FirestoreService {
  static async createDashboard(
    dashboardData: Omit<
      DashboardDocument,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >,
    userId: string,
    customId?: string
  ) {
    return this.createDocument<DashboardDocument>(
      COLLECTIONS.DASHBOARDS,
      dashboardData,
      userId,
      customId
    );
  }

  static async getDashboard(dashboardId: string) {
    return this.getDocument<DashboardDocument>(
      COLLECTIONS.DASHBOARDS,
      dashboardId
    );
  }

  static async updateDashboard(
    dashboardId: string,
    updates: Partial<DashboardDocument>,
    userId: string
  ) {
    return this.updateDocument<DashboardDocument>(
      COLLECTIONS.DASHBOARDS,
      dashboardId,
      updates,
      userId
    );
  }

  static async deleteDashboard(dashboardId: string) {
    return this.deleteDocument(COLLECTIONS.DASHBOARDS, dashboardId);
  }

  static async getDashboardsByTenant(
    tenantId: string,
    options?: { page?: number; pageSize?: number }
  ) {
    return this.getDocuments<DashboardDocument>(COLLECTIONS.DASHBOARDS, {
      ...options,
      where: [{ field: "tenantId", operator: "==", value: tenantId }],
    });
  }
}

// Widget Service
export class WidgetService extends FirestoreService {
  static async createWidget(
    widgetData: Omit<
      WidgetDocument,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >,
    userId: string
  ) {
    return this.createDocument<WidgetDocument>(
      COLLECTIONS.WIDGETS,
      widgetData,
      userId
    );
  }

  static async getWidget(widgetId: string) {
    return this.getDocument<WidgetDocument>(COLLECTIONS.WIDGETS, widgetId);
  }

  static async updateWidget(
    widgetId: string,
    updates: Partial<WidgetDocument>,
    userId: string
  ) {
    return this.updateDocument<WidgetDocument>(
      COLLECTIONS.WIDGETS,
      widgetId,
      updates,
      userId
    );
  }

  static async deleteWidget(widgetId: string) {
    return this.deleteDocument(COLLECTIONS.WIDGETS, widgetId);
  }

  static async getWidgetsByDashboard(
    dashboardId: string,
    options?: { page?: number; pageSize?: number }
  ) {
    return this.getDocuments<WidgetDocument>(COLLECTIONS.WIDGETS, {
      ...options,
      where: [{ field: "dashboardId", operator: "==", value: dashboardId }],
    });
  }
}
