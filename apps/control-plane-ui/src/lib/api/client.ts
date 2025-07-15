/**
 * API Client
 * Centralized HTTP client with error handling and interceptors
 */

import { ApiResponse, ApiError as ApiErrorType } from "@/types/api";

export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = "/api") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string) {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  /**
   * Remove authorization token
   */
  removeAuthToken() {
    delete this.defaultHeaders.Authorization;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      ...this.defaultHeaders,
      ...config?.headers,
    };

    const requestInit: RequestInit = {
      method,
      headers,
      signal: config?.timeout ? AbortSignal.timeout(config.timeout) : undefined,
    };

    // Add body for non-GET requests
    if (data && method !== "GET") {
      requestInit.body = JSON.stringify(data);
    }

    // Add query parameters for GET requests
    if (data && method === "GET") {
      const params = new URLSearchParams(data);
      const separator = endpoint.includes("?") ? "&" : "?";
      endpoint += `${separator}${params.toString()}`;
    }

    try {
      const response = await fetch(url, requestInit);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          errorData.code,
          response.status
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Log error for debugging
      console.error("API Request failed:", {
        method,
        url,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Re-throw ApiError or create new one
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : "Network request failed",
        "NETWORK_ERROR"
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, config);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, data, config);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, config);
  }
}

/**
 * Custom ApiError class
 */
class ApiError extends Error {
  public code?: string;
  public statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export { ApiError };
