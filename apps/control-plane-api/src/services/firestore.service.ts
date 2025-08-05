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

  // License Management Methods
  static async createLicense(tenantId: string, licenseData: any) {
    try {
      const licenseRef = db
        .collection(COLLECTIONS.TENANTS)
        .doc(tenantId)
        .collection("licenses")
        .doc(licenseData.licenseKey);

      await licenseRef.set(licenseData);

      return {
        success: true,
        data: licenseData,
        message: "License created successfully",
      };
    } catch (error) {
      console.error("Error creating license:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create license",
      };
    }
  }

  static async getLicenses(tenantId: string) {
    try {
      const licensesRef = db
        .collection(COLLECTIONS.TENANTS)
        .doc(tenantId)
        .collection("licenses");

      const snapshot = await licensesRef.get();
      const licenses = snapshot.docs.map((doc) => doc.data());

      return {
        success: true,
        data: licenses,
        message: "Licenses retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting licenses:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get licenses",
      };
    }
  }

  static async getLicense(tenantId: string, licenseKey: string) {
    try {
      const licenseRef = db
        .collection(COLLECTIONS.TENANTS)
        .doc(tenantId)
        .collection("licenses")
        .doc(licenseKey);

      const doc = await licenseRef.get();

      if (!doc.exists) {
        return {
          success: false,
          message: "License not found",
        };
      }

      return {
        success: true,
        data: doc.data(),
        message: "License retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting license:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get license",
      };
    }
  }

  static async updateLicense(
    tenantId: string,
    licenseKey: string,
    updates: any
  ) {
    try {
      const licenseRef = db
        .collection(COLLECTIONS.TENANTS)
        .doc(tenantId)
        .collection("licenses")
        .doc(licenseKey);

      await licenseRef.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: "License updated successfully",
      };
    } catch (error) {
      console.error("Error updating license:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update license",
      };
    }
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
    // Handle test tenant with sample dashboards stored in subcollection
    if (tenantId === "test-company") {
      try {
        // Try to get dashboards from subcollection first
        const dashboardsRef = db
          .collection("tenants")
          .doc(tenantId)
          .collection("dashboards");

        const snapshot = await dashboardsRef.get();

        if (!snapshot.empty) {
          // Return real data from Firestore subcollection
          const dashboards = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Parse visualConfig if it's a string
              visualConfig:
                typeof data.visualConfig === "string"
                  ? JSON.parse(data.visualConfig)
                  : data.visualConfig,
              createdAt:
                data.createdAt?.toDate().toISOString() ||
                new Date().toISOString(),
              updatedAt:
                data.updatedAt?.toDate().toISOString() ||
                new Date().toISOString(),
            };
          });

          return {
            success: true,
            data: dashboards,
            pagination: {
              page: options?.page || 1,
              pageSize: options?.pageSize || 20,
              total: dashboards.length,
              totalPages: Math.ceil(
                dashboards.length / (options?.pageSize || 20)
              ),
            },
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.error("Error fetching dashboards from subcollection:", error);
      }

      // Fallback to sample data if no real dashboards exist
      return {
        success: true,
        data: [
          {
            id: "sales-dashboard",
            name: "Sales Dashboard",
            slug: "sales-dashboard",
            description: "Sales performance metrics",
            tenantId: "test-company",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin",
            updatedBy: "admin",
            visualConfig: {
              layout: {
                columns: 24,
                rows: 16,
                gridSize: 40,
              },
              widgets: [
                {
                  id: "total-revenue",
                  type: "metric",
                  title: "Total Revenue",
                  value: "$2,543,892",
                  change: "+12.5%",
                  trend: "up",
                  position: { x: 0, y: 0, w: 6, h: 4 },
                },
                {
                  id: "monthly-sales",
                  type: "chart",
                  title: "Monthly Sales",
                  chartType: "line",
                  data: [
                    { month: "Jan", value: 45000 },
                    { month: "Feb", value: 52000 },
                    { month: "Mar", value: 48000 },
                    { month: "Apr", value: 61000 },
                    { month: "May", value: 55000 },
                    { month: "Jun", value: 67000 },
                  ],
                  position: { x: 6, y: 0, w: 12, h: 8 },
                },
                {
                  id: "top-products",
                  type: "table",
                  title: "Top Products",
                  columns: ["Product", "Sales", "Growth"],
                  data: [
                    ["Product A", "$125,000", "+8.2%"],
                    ["Product B", "$98,000", "+12.1%"],
                    ["Product C", "$87,000", "-2.3%"],
                  ],
                  position: { x: 18, y: 0, w: 6, h: 8 },
                },
              ],
            },
          },
          {
            id: "analytics-dashboard",
            name: "Analytics Dashboard",
            slug: "analytics-dashboard",
            description: "User analytics and engagement",
            tenantId: "test-company",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "admin",
            updatedBy: "admin",
            visualConfig: {
              layout: {
                columns: 24,
                rows: 16,
                gridSize: 40,
              },
              widgets: [
                {
                  id: "active-users",
                  type: "metric",
                  title: "Active Users",
                  value: "24,567",
                  change: "+5.2%",
                  trend: "up",
                  position: { x: 0, y: 0, w: 6, h: 4 },
                },
                {
                  id: "user-engagement",
                  type: "chart",
                  title: "User Engagement",
                  chartType: "bar",
                  data: [
                    { category: "Page Views", value: 152000 },
                    { category: "Sessions", value: 89000 },
                    { category: "Bounce Rate", value: 2.3 },
                  ],
                  position: { x: 6, y: 0, w: 12, h: 8 },
                },
              ],
            },
          },
        ],
        pagination: {
          page: options?.page || 1,
          pageSize: options?.pageSize || 20,
          total: 2,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // For other tenants, get from subcollection
    try {
      const dashboardsRef = db
        .collection("tenants")
        .doc(tenantId)
        .collection("dashboards");

      const snapshot = await dashboardsRef.get();
      const dashboards = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Parse visualConfig if it's a string
          visualConfig:
            typeof data.visualConfig === "string"
              ? JSON.parse(data.visualConfig)
              : data.visualConfig,
          createdAt:
            data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt:
            data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
      });

      return {
        success: true,
        data: dashboards,
        pagination: {
          page: options?.page || 1,
          pageSize: options?.pageSize || 20,
          total: dashboards.length,
          totalPages: Math.ceil(dashboards.length / (options?.pageSize || 20)),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      return {
        success: false,
        data: [],
        pagination: {
          page: options?.page || 1,
          pageSize: options?.pageSize || 20,
          total: 0,
          totalPages: 0,
        },
        timestamp: new Date().toISOString(),
      };
    }
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
