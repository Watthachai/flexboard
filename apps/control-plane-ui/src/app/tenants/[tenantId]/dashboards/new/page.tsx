"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AppLayout from "@/components/layout/app-layout";

interface DashboardSetupData {
  name: string;
  description: string;
  template: string;
}

type Step = "setup" | "template";

const DASHBOARD_TEMPLATES = [
  {
    id: "blank",
    name: "Blank Dashboard",
    description: "Start with a clean slate",
    icon: "📄",
  },
  {
    id: "sales",
    name: "Sales Dashboard",
    description: "Track sales metrics and KPIs",
    icon: "📈",
  },
  {
    id: "analytics",
    name: "Analytics Dashboard",
    description: "Monitor website and app analytics",
    icon: "📊",
  },
  {
    id: "operations",
    name: "Operations Dashboard",
    description: "Track operational metrics",
    icon: "⚙️",
  },
];

export default function NewDashboardPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  const router = useRouter();
  const [step, setStep] = useState<Step>("setup");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DashboardSetupData>({
    name: "",
    description: "",
    template: "blank",
  });

  const handleNext = () => {
    if (step === "setup") {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep("template");
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleBack = () => {
    if (step === "template") {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep("setup");
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) return;

    setLoading(true);

    try {
      const dashboardConfig = {
        apiVersion: "flexboard/v1",
        kind: "Dashboard",
        metadata: {
          name: formData.name,
          slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: formData.description || "",
          template: formData.template || "blank",
        },
        spec: {
          layout: {
            type: "grid",
            breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
            cols: { lg: 24, md: 20, sm: 16, xs: 12, xxs: 6 },
            rowHeight: 30,
          },
          widgets: [
            ...(formData.template === "sales"
              ? [
                  {
                    id: "sales-metric",
                    type: "metric",
                    title: "Total Sales",
                    position: { x: 0, y: 0, w: 6, h: 4 },
                    config: {
                      value: "${data.totalSales}",
                      format: "currency",
                      change: "${data.salesChange}",
                      trend: "up",
                    },
                  },
                  {
                    id: "sales-chart",
                    type: "chart",
                    title: "Sales Trends",
                    position: { x: 6, y: 0, w: 12, h: 8 },
                    config: {
                      chartType: "line",
                      dataSource: "${data.salesTrends}",
                      xAxis: "date",
                      yAxis: "amount",
                    },
                  },
                ]
              : formData.template === "analytics"
                ? [
                    {
                      id: "pageviews-metric",
                      type: "metric",
                      title: "Page Views",
                      position: { x: 0, y: 0, w: 6, h: 4 },
                      config: {
                        value: "${data.pageviews}",
                        format: "number",
                        change: "${data.pageviewsChange}",
                        trend: "up",
                      },
                    },
                  ]
                : []),
          ],
          dataSources: [],
        },
      };

      console.log("📊 Dashboard config:", dashboardConfig);

      // ส่งไปยัง dashboard-as-code API
      const response = await fetch(
        `/api/tenants/${tenantId}/dashboard-as-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dashboardConfig),
        }
      );

      console.log("🌐 API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Dashboard created:", result);

      if (!result.success) {
        throw new Error(
          result.error || result.message || "Failed to create dashboard"
        );
      }

      // ตรวจสอบ structure ของ result
      console.log("📊 Result structure:", {
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        dataId: result.data?.id,
        fullResult: result,
      });

      const dashboardId = result.data?.id;

      if (!dashboardId) {
        console.error("❌ No dashboard ID found in response:", result);
        throw new Error("Dashboard was created but no ID was returned");
      }

      console.log("📝 Dashboard ID:", dashboardId);

      // Redirect ไปยัง dashboard-as-code editor
      router.push(
        `/tenants/${tenantId}/dashboards/${dashboardId}/dashboard-as-code`
      );
    } catch (error) {
      console.error("💥 Error creating dashboard:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to create dashboard: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Create New Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Set up your dashboard in simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto pb-4 px-4">
            {/* Step 1 */}
            <div
              className={`flex items-center transition-all duration-300 min-w-max ${
                step === "setup"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-sm lg:text-base font-medium transition-all duration-300 ${
                  step === "setup"
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap">
                Basic Info
              </span>
            </div>

            {/* Connector */}
            <div className="w-8 sm:w-12 lg:w-16 xl:w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded transition-all duration-300">
              <div
                className={`h-full bg-blue-600 dark:bg-blue-400 rounded transition-all duration-500 ${
                  step === "template" ? "w-full" : "w-0"
                }`}
              />
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center transition-all duration-300 min-w-max ${
                step === "template"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-sm lg:text-base font-medium transition-all duration-300 ${
                  step === "template"
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap">
                Template
              </span>
            </div>
          </div>
        </div>

        {/* Step Content with Slide Animation */}
        <div className="relative overflow-hidden w-full">
          <Card
            className={`w-full p-4 sm:p-6 lg:p-8 xl:p-12 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 transform translate-x-4"
                : "opacity-100 transform translate-x-0"
            }`}
          >
            {step === "setup" && (
              <div className="animate-fade-in w-full max-w-4xl mx-auto">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-gray-900 dark:text-gray-100">
                  Dashboard Information
                </h2>

                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 lg:mb-3"
                    >
                      Dashboard Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md lg:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                      placeholder="Enter dashboard name..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 lg:mb-3"
                    >
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md lg:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors resize-none"
                      rows={3}
                      placeholder="Brief description of your dashboard..."
                    />
                  </div>
                </div>
              </div>
            )}

            {step === "template" && (
              <div className="animate-fade-in w-full">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-gray-900 dark:text-gray-100">
                  Choose Template
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                  {DASHBOARD_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`relative p-4 sm:p-6 lg:p-8 border-2 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-200 hover:shadow-xl ${
                        formData.template === template.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-xl scale-105"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:scale-102"
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          template: template.id,
                        }));
                      }}
                    >
                      <div className="text-2xl sm:text-3xl lg:text-4xl mb-3 lg:mb-4">
                        {template.icon}
                      </div>
                      <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-2 lg:mb-3 text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        {template.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-6 sm:mt-8 lg:mt-12 gap-4 w-full">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === "setup" || isTransitioning}
            className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base order-2 sm:order-1 transition-all duration-200"
          >
            {isTransitioning ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Loading...
              </div>
            ) : (
              "Back"
            )}
          </Button>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/tenants/${tenantId}`)}
              className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base transition-all duration-200"
              disabled={loading || isTransitioning}
            >
              Cancel
            </Button>

            {step === "template" ? (
              <Button
                onClick={handleCreate}
                disabled={loading || !formData.name || isTransitioning}
                className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Dashboard...
                  </div>
                ) : (
                  "Create Dashboard"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={
                  (step === "setup" && !formData.name) || isTransitioning
                }
                className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all duration-200 disabled:opacity-50"
              >
                {isTransitioning ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Next...
                  </div>
                ) : (
                  "Next"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add custom CSS for animations and responsive utilities */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        /* Custom scrollbar for webkit browsers */
        .overflow-x-auto::-webkit-scrollbar {
          height: 4px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 2px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }

        /* Dark mode scrollbar */
        @media (prefers-color-scheme: dark) {
          .overflow-x-auto::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </AppLayout>
  );
}
