/**
 * OnPrem Viewer App Layout with Firebase Authentication (2-Step Process)
 * Step 1: Email/Password login with Firebase
 * Step 2: License key validation
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { VersionDisplay } from "@/components/VersionDisplay";
import { ThemeProvider, useTheme } from "@/app/components/context/ThemeContext";
import { CompanyProvider } from "@/app/components/context/CompanyContext";
import { SessionStorage, type SessionData } from "@/utils/sessionStorage";
import "./globals.css";
// import "@/services/autoStartService"; // Temporarily disabled
// Import logger to auto-disable console in production
import "@/utils/logger";

interface UserSession {
  email: string;
  tenantId: string;
  companyName: string;
  features: string[];
  expiryDate: string;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const isCheckingSession = useRef(false);

  const checkSession = useCallback(async () => {
    // Prevent multiple simultaneous session checks
    if (isCheckingSession.current) {
      console.log("Session check already in progress, skipping...");
      return;
    }

    isCheckingSession.current = true;

    try {
      // Check Firebase session using HTTP-only cookies
      const response = await fetch("/api/auth/validate", {
        credentials: "include", // Include HTTP-only cookies
        cache: "no-cache", // Prevent caching of auth checks
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user && result.license) {
          const newSession = {
            email: result.user.email,
            tenantId: result.license.tenantId,
            companyName: result.license.companyName,
            branchNames: result.license.branchNames || [],
            features: result.license.features || [],
            expiryDate: result.license.expiryDate,
          };

          console.log("Session valid:", {
            email: newSession.email,
            tenantId: newSession.tenantId,
            companyName: newSession.companyName,
          });

          setSession(newSession);
          setLoading(false);

          // Save session to localStorage as fallback
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("userSession", JSON.stringify(newSession));
          }

          return;
        }
      }

      // If authentication fails, clear localStorage and session
      console.log("Authentication failed or expired");
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("userSession");

        // Check if we have a fallback session in localStorage
        const savedSession = localStorage.getItem("userSession");
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            // Only use saved session if license hasn't expired
            if (
              sessionData.expiryDate &&
              new Date(sessionData.expiryDate) > new Date()
            ) {
              console.log("Using cached session as fallback");
              setSession(sessionData);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error("Failed to parse cached session:", parseError);
            localStorage.removeItem("userSession");
          }
        }
      }

      setSession(null);
    } catch (error) {
      console.error("Session check failed:", error);

      // Try using localStorage fallback
      if (typeof window !== "undefined" && window.localStorage) {
        const savedSession = localStorage.getItem("userSession");
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            // Only use saved session if license hasn't expired
            if (
              sessionData.expiryDate &&
              new Date(sessionData.expiryDate) > new Date()
            ) {
              console.log("Using cached session during error");
              setSession(sessionData);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error("Failed to parse cached session:", parseError);
            localStorage.removeItem("userSession");
          }
        }
      }

      setSession(null);
    } finally {
      setLoading(false);
      isCheckingSession.current = false;
    }
  }, []);

  // Session validation - run only once on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Periodic session refresh - run only once on mount
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log("Periodic session refresh...");
      if (!isCheckingSession.current) {
        checkSession();
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [checkSession]);

  // Initial localStorage check
  useEffect(() => {
    // Check if we have a saved session as fallback during initial load
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      !session &&
      loading
    ) {
      const savedSession = localStorage.getItem("userSession");
      if (savedSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          // Only use saved session if license hasn't expired
          if (
            sessionData.expiryDate &&
            new Date(sessionData.expiryDate) > new Date()
          ) {
            console.log("Using cached session on initial load");
            setSession(sessionData);
            setLoading(false);
          } else {
            // Remove expired session
            localStorage.removeItem("userSession");
          }
        } catch (error) {
          console.error("Failed to parse saved session:", error);
          localStorage.removeItem("userSession");
        }
      }
    }
  }, [session, loading]);

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    setLoading(false);

    // Save session to localStorage (excluding sensitive data)
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("userSession", JSON.stringify(newSession));
    }

    // Redirect to PVS Dashboard after successful login
    if (typeof window !== "undefined") {
      window.location.href = "/pvs";
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <html lang="en">
          <body className="bg-gray-50 dark:bg-gray-900">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">
                  Checking authentication...
                </p>
              </div>
            </div>
          </body>
        </html>
      </ThemeProvider>
    );
  }

  // Show login screen if not authenticated
  if (!session) {
    return (
      <ThemeProvider>
        <html lang="en">
          <body className="bg-gray-50 dark:bg-gray-900">
            <LoginScreen onLogin={handleLogin} />
          </body>
        </html>
      </ThemeProvider>
    );
  }

  // Show authenticated layout
  return (
    <ThemeProvider>
      <CompanyProvider>
        <html lang="en">
          <body className="bg-gray-50 dark:bg-gray-900">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              {/* Main content */}
              <main className="h-screen">{children}</main>
            </div>
          </body>
        </html>
      </CompanyProvider>
    </ThemeProvider>
  );
}

// Login Screen Component with 2-Step Process
interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [step, setStep] = useState<"login" | "license">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<{
    cookies?: Array<{ name: string; hasValue: boolean; valueLength: number }>;
    cookieNames?: string[];
    timestamp?: string;
    clientCookies?: string[];
    clientCookieCount?: number;
  } | null>(null);
  interface UserInfo {
    email: string;
  }

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Debug function to check cookies
  const checkCookieDebug = async () => {
    try {
      // Check client-side cookies first
      const clientCookies = document.cookie
        .split(";")
        .map((c) => c.trim())
        .filter((c) => c);
      console.log("[DEBUG] Client-side cookies:", clientCookies);

      // Check server-side cookies via API
      const response = await fetch("/api/debug/cookies", {
        credentials: "include",
      });
      const result = await response.json();

      setDebugInfo({
        ...result,
        clientCookies: clientCookies,
        clientCookieCount: clientCookies.length,
      });
      console.log("[DEBUG] Server cookie info:", result);
      console.log("[DEBUG] Client cookie info:", clientCookies);
    } catch (error) {
      console.error("[DEBUG] Failed to check cookies:", error);
    }
  };

  // Load saved license key from localStorage on component mount
  useEffect(() => {
    const savedLicenseKey = localStorage.getItem("flexboard-license-key");
    if (savedLicenseKey) {
      setLicenseKey(savedLicenseKey);
      console.log("Loaded saved license key from localStorage");
    }
  }, []);

  // Check if user already has a license
  const checkUserLicense = async (user: UserInfo) => {
    try {
      const response = await fetch("/api/auth/check-license", {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok && result.success && result.hasLicense) {
        // User already has valid license, proceed directly
        onLogin({
          email: user.email,
          tenantId: result.license.tenantId,
          companyName: result.license.companyName,
          features: result.license.features,
          expiryDate: result.license.expiryDate,
        });
      } else {
        // User needs to set license key
        const savedLicenseKey = localStorage.getItem("flexboard-license-key");
        if (savedLicenseKey) {
          // Try auto license validation with saved key
          console.log("Attempting auto license validation with saved key...");
          try {
            const licenseResponse = await fetch("/api/auth/license-validate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                licenseKey: savedLicenseKey,
                email: user.email,
              }),
            });

            const licenseResult = await licenseResponse.json();
            if (licenseResponse.ok && licenseResult.success) {
              // Auto license validation successful
              console.log("Auto license validation successful");
              onLogin({
                email: user.email,
                tenantId: licenseResult.license.tenantId,
                companyName: licenseResult.license.companyName,
                features: licenseResult.license.features,
                expiryDate: licenseResult.license.expiryDate,
              });
              return; // Exit early, no need to show license step
            } else {
              console.log("Saved license key is invalid, showing license step");
            }
          } catch (error) {
            console.error("Auto license validation error:", error);
          }
        }
        setStep("license");
      }
    } catch (error) {
      console.error("License check error:", error);
      // On error, fall back to license step
      setStep("license");
    }
  };

  // Step 1: Firebase Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Firebase Email/Password authentication
      const response = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include HTTP-only cookies
        body: JSON.stringify({
          email,
          password,
          userAgent: navigator.userAgent,
          ipAddress: "client-side", // Will be overridden by server
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Email login successful
        setUserInfo(result.user);
        setError("");

        // Save session data to localStorage as fallback
        if (SessionStorage.isAvailable() && result.sessionToken) {
          const sessionData: SessionData = {
            sessionToken: result.sessionToken,
            userId: result.user.uid,
            email: result.user.email,
            license: result.license || undefined,
            timestamp: new Date().toISOString(),
          };
          SessionStorage.save(sessionData);
        }

        // Check if user already has stored license on server
        if (result.hasStoredLicense && result.license) {
          console.log("[UI] User has stored license, logging in directly");
          // User has stored license, login directly
          onLogin({
            email: result.user.email,
            tenantId: result.license.tenantId,
            companyName: result.license.companyName,
            features: result.license.features,
            expiryDate: result.license.expiryDate,
          });
          return; // Exit early, no need for license step
        } else {
          console.log(
            "[UI] No stored license found, checking for saved license key"
          );
          // No stored license, try to check for locally saved license key
          await checkUserLicense(result.user);
        }
      } else {
        setError(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: License Key Validation
  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First try normal license validation (with cookies)
      let response = await fetch("/api/auth/license-validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include HTTP-only cookies
        body: JSON.stringify({
          licenseKey,
          email: userInfo?.email,
        }),
      });

      let result = await response.json();

      // If failed due to missing session (cookies not working), try fallback with localStorage
      if (!response.ok && result.message?.includes("Authentication required")) {
        console.log("[UI] Cookies failed, trying localStorage fallback");
        const sessionData = SessionStorage.load();

        if (sessionData && sessionData.sessionToken && sessionData.userId) {
          response = await fetch("/api/auth/license-validate-fallback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              licenseKey,
              email: userInfo?.email,
              sessionToken: sessionData.sessionToken,
              userId: sessionData.userId,
            }),
          });

          result = await response.json();
          console.log("[UI] Fallback license validation result:", {
            success: result.success,
          });
        } else {
          throw new Error("No session data available for fallback");
        }
      }

      if (response.ok && result.success) {
        // License validation successful - save license key to localStorage
        localStorage.setItem("flexboard-license-key", licenseKey);
        console.log("License key saved to localStorage");

        // Auto-save to .env file
        try {
          const envResponse = await fetch("/api/auth/save-license-env", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ licenseKey }),
          });
          const envResult = await envResponse.json();
          if (envResult.success) {
            console.log("License key automatically saved to .env file");
          } else {
            console.warn("Failed to auto-save to .env:", envResult.error);
          }
        } catch (error) {
          console.warn("Error auto-saving to .env file:", error);
        }

        // Login user
        onLogin({
          email: userInfo?.email || "",
          tenantId: result.license.tenantId,
          companyName: result.license.companyName,
          features: result.license.features,
          expiryDate: result.license.expiryDate,
        });
      } else {
        setError(result.message || "License validation failed");
      }
    } catch (error) {
      console.error("License validation error:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "license") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <span className="text-4xl">🔑</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                License Validation
              </h1>
            </div>
            <h2 className="text-xl text-gray-600 dark:text-gray-300">
              Welcome, {userInfo?.email}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please enter your company license key. This will be permanently
              saved to your account, so you won&apos;t need to enter it again
              for future logins.
            </p>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>One-time setup:</strong> After entering your license
                key, you can login with just your email and password from any
                device.
              </p>
            </div>
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                🌐 <strong>Cross-device access:</strong> Your license will be
                saved to our secure server and automatically applied when you
                login from other computers or browsers.
              </p>
            </div>
          </div>

          {/* License Form */}
          <form onSubmit={handleLicenseSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              {/* License Key */}
              <div>
                <label
                  htmlFor="licenseKey"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  License Key
                </label>
                <input
                  id="licenseKey"
                  type="text"
                  required
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="FLX-XXX-XXX-XXX-XXXXXX-XXXXXX"
                />
                {localStorage.getItem("flexboard-license-key") && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    ✅ License key loaded from saved data
                  </p>
                )}
                {licenseKey && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("flexboard-license-key");
                      setLicenseKey("");
                    }}
                    className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                  >
                    Clear saved license key
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating License...
                </div>
              ) : (
                "Access Dashboard"
              )}
            </button>

            {/* Back to login */}
            <button
              type="button"
              onClick={() => {
                setStep("login");
                setUserInfo(null);
                setLicenseKey("");
                setError("");
              }}
              className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ← Back to login
            </button>
          </form>

          {/* Dark Mode Toggle */}
          <div className="flex justify-center">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <span className="text-4xl">📊</span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              FlexBoard OnPrem
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in to your account to access dashboards
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Your password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Features */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <span>🔒</span>
            <span>Secure OnPremise Deployment</span>
          </div>
          <div>
            Firebase Authentication • License verification • Session based
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex justify-center">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* Version Display */}
        <div className="flex justify-center pt-4">
          <VersionDisplay variant="minimal" />
        </div>

        {/* Debug Section (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center mb-2 space-x-2">
              <button
                type="button"
                onClick={checkCookieDebug}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                🍪 Debug Cookies
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/test/cookie-echo", {
                      credentials: "include",
                    });
                    const result = await response.json();
                    console.log("[ECHO] Cookie echo result:", result);
                    alert(
                      `Cookie Echo:\nRaw: ${
                        result.rawCookieHeader || "none"
                      }\nCount: ${result.cookieCount}`
                    );
                  } catch (error) {
                    console.error("[ECHO] Failed:", error);
                    alert("Echo test failed - check console");
                  }
                }}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                📡 Echo Test
              </button>
            </div>
            {debugInfo && (
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>
                  <strong>Server Cookies:</strong>{" "}
                  {debugInfo.cookieNames?.join(", ") || "none"}
                </div>
                <div>
                  <strong>Client Cookies:</strong>{" "}
                  {debugInfo.clientCookieCount || 0} found
                </div>
                <div>
                  <strong>Timestamp:</strong> {debugInfo.timestamp}
                </div>
                {debugInfo.clientCookies &&
                  debugInfo.clientCookies.length > 0 && (
                    <div className="text-[10px] space-y-1">
                      <div>
                        <strong>Client cookie details:</strong>
                      </div>
                      {debugInfo.clientCookies.map(
                        (cookie: string, index: number) => (
                          <div key={index}>{cookie.substring(0, 50)}...</div>
                        )
                      )}
                    </div>
                  )}
                {debugInfo.cookies?.map(
                  (
                    cookie: {
                      name: string;
                      hasValue: boolean;
                      valueLength: number;
                    },
                    index: number
                  ) => (
                    <div key={index} className="text-[10px]">
                      Server: {cookie.name}:{" "}
                      {cookie.hasValue
                        ? `${cookie.valueLength} chars`
                        : "empty"}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
