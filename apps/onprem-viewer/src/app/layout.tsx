/**
 * OnPrem Viewer App Layout with Firebase Authentication (2-Step Process)
 * Step 1: Email/Password login with Firebase
 * Step 2: License key validation
 */
"use client";

import { useEffect, useState } from "react";
import { VersionDisplay } from "@/components/VersionDisplay";
import { ThemeProvider, useTheme } from "@/app/components/context/ThemeContext";
import "./globals.css";
import "@/services/autoStartService";

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

  useEffect(() => {
    checkSession();
    // Check if we have a saved session as fallback
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
  }, []);

  const checkSession = async () => {
    try {
      // Check Firebase session using HTTP-only cookies
      const response = await fetch("/api/auth/validate", {
        credentials: "include", // Include HTTP-only cookies
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user && result.license) {
          setSession({
            email: result.user.email,
            tenantId: result.license.tenantId,
            companyName: result.license.companyName,
            features: result.license.features,
            expiryDate: result.license.expiryDate,
          });
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    setLoading(false);

    // Save session to localStorage (excluding sensitive data)
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("userSession", JSON.stringify(newSession));
    }
  };

  const handleLogout = async () => {
    try {
      // Call Firebase logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include HTTP-only cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear local state and localStorage
    setSession(null);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("userSession");
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
      <html lang="en">
        <body className="bg-gray-50 dark:bg-gray-900">
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Main content */}
            <main className="h-screen">{children}</main>
          </div>
        </body>
      </html>
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
  interface UserInfo {
    email: string;
  }

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

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
        // Email login successful, check if user already has license
        setUserInfo(result.user);
        setError("");

        // Auto-check if user has existing license
        await checkUserLicense(result.user);
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
      // Validate license key with current user
      const response = await fetch("/api/auth/license-validate", {
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

      const result = await response.json();

      if (response.ok && result.success) {
        // License validation successful
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
              Please enter your company license key. This will be saved to your
              account for future logins.
            </p>
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
      </div>
    </div>
  );
}
