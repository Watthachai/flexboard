/**
 * Session Storage Utility
 * Fallback for when cookies don't work
 */

export interface SessionData {
  sessionToken: string;
  userId: string;
  email: string;
  license?: {
    tenantId: string;
    companyName: string;
    features: string[];
    expiryDate: string;
  };
  timestamp: string;
}

export class SessionStorage {
  private static readonly SESSION_KEY = "flexboard-session";
  private static readonly SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static save(data: SessionData): boolean {
    if (typeof window === "undefined") return false;

    try {
      const sessionData = {
        ...data,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.SESSION_EXPIRY).toISOString(),
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      console.log("[SESSION] Saved to localStorage:", {
        email: data.email,
        hasToken: !!data.sessionToken,
        hasLicense: !!data.license,
      });
      return true;
    } catch (error) {
      console.error("[SESSION] Failed to save to localStorage:", error);
      return false;
    }
  }

  static load(): SessionData | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (!stored) return null;

      const sessionData = JSON.parse(stored);

      // Check if expired
      if (
        sessionData.expiresAt &&
        new Date(sessionData.expiresAt) < new Date()
      ) {
        console.log("[SESSION] Session expired, removing");
        this.clear();
        return null;
      }

      console.log("[SESSION] Loaded from localStorage:", {
        email: sessionData.email,
        hasToken: !!sessionData.sessionToken,
        hasLicense: !!sessionData.license,
        timestamp: sessionData.timestamp,
      });

      return sessionData;
    } catch (error) {
      console.error("[SESSION] Failed to load from localStorage:", error);
      this.clear();
      return null;
    }
  }

  static clear(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this.SESSION_KEY);
      console.log("[SESSION] Cleared localStorage session");
    } catch (error) {
      console.error("[SESSION] Failed to clear localStorage:", error);
    }
  }

  static isAvailable(): boolean {
    return typeof window !== "undefined" && !!window.localStorage;
  }
}
