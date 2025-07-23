"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataImport from "@/components/data/data-import";

interface DashboardSetupData {
  name: string;
  description?: string;
  dataSourceType: "upload" | "database" | "api" | "mock";
  template?: string;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

const DATA_SOURCES: DataSource[] = [
  {
    id: "upload",
    name: "Upload File",
    description: "CSV, Excel, or XML files",
    icon: "📁",
    available: true,
  },
  {
    id: "mock",
    name: "Sample Data",
    description: "Use demo data to get started",
    icon: "🎯",
    available: true,
  },
  {
    id: "database",
    name: "Database",
    description: "MySQL, PostgreSQL, MongoDB",
    icon: "🗄️",
    available: false, // Phase 2
  },
  {
    id: "api",
    name: "API Endpoint",
    description: "REST API or GraphQL",
    icon: "🔗",
    available: false, // Phase 2
  },
];

const SAMPLE_TEMPLATES = [
  {
    id: "sales",
    name: "Sales Dashboard",
    description: "Revenue, sales trends, top products",
    preview: "📊",
  },
  {
    id: "analytics",
    name: "Website Analytics",
    description: "Page views, users, conversion rates",
    preview: "📈",
  },
  {
    id: "financial",
    name: "Financial Overview",
    description: "Income, expenses, profit margins",
    preview: "💰",
  },
  {
    id: "blank",
    name: "Blank Dashboard",
    description: "Start from scratch",
    preview: "📋",
  },
];

export default function NewDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const [step, setStep] = useState<
    "setup" | "datasource" | "upload" | "template"
  >("setup");
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState<DashboardSetupData>({
    name: "",
    description: "",
    dataSourceType: "mock",
    template: "blank",
  });
  const [uploadedData, setUploadedData] = useState<any>(null);

  // Animated step transition
  const handleStepTransition = (newStep: typeof step) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(newStep);
      setIsTransitioning(false);
    }, 150);
  };

  const handleNext = () => {
    if (step === "setup") {
      handleStepTransition("datasource");
    } else if (step === "datasource") {
      // ถ้าเลือก upload file ให้ไปหน้า upload
      if (formData.dataSourceType === "upload") {
        handleStepTransition("upload");
      } else {
        handleStepTransition("template");
      }
    } else if (step === "upload") {
      handleStepTransition("template");
    }
  };

  const handleBack = () => {
    if (step === "datasource") {
      handleStepTransition("setup");
    } else if (step === "upload") {
      handleStepTransition("datasource");
    } else if (step === "template") {
      // ถ้ามาจาก upload ให้กลับไป upload, ถ้าไม่ใช่ให้กลับไป datasource
      if (formData.dataSourceType === "upload") {
        handleStepTransition("upload");
      } else {
        handleStepTransition("datasource");
      }
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);

      // 1. สร้าง Dashboard
      const dashboardResponse = await fetch(
        `/api/tenants/${tenantId}/dashboards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            isPublic: false,
            settings: {
              refreshInterval: 30000, // 30 seconds
              theme: "light",
              autoRefresh: true,
            },
            status: "draft",
            tags: [],
            visualConfig: {
              layout: {
                columns: 24,
                rows: 16,
                gridSize: 40,
              },
              widgets: [],
            },
            dataSourceConfig: {
              type: formData.dataSourceType,
              template: formData.template,
              uploadedData: uploadedData
                ? JSON.stringify(uploadedData)
                : undefined, // Serialize เป็น JSON string
            },
          }),
        }
      );

      const result = await dashboardResponse.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create dashboard");
      }

      // 2. Redirect ไปยัง Builder
      router.push(`/tenants/${tenantId}/dashboards/${result.data.id}/builder`);
    } catch (error) {
      console.error("Error creating dashboard:", error);
      alert("Failed to create dashboard. Please try again.");
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
                  step !== "setup" ? "w-full" : "w-0"
                }`}
              />
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center transition-all duration-300 min-w-max ${
                step === "datasource"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-sm lg:text-base font-medium transition-all duration-300 ${
                  step === "datasource"
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap">
                Data Source
              </span>
            </div>

            {/* Upload Step (conditional) */}
            {formData.dataSourceType === "upload" && (
              <>
                <div className="w-8 sm:w-12 lg:w-16 xl:w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded transition-all duration-300">
                  <div
                    className={`h-full bg-blue-600 dark:bg-blue-400 rounded transition-all duration-500 ${
                      step === "upload" || step === "template"
                        ? "w-full"
                        : "w-0"
                    }`}
                  />
                </div>
                <div
                  className={`flex items-center transition-all duration-300 min-w-max ${
                    step === "upload"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium transition-all duration-300 ${
                      step === "upload"
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    📁
                  </div>
                  <span className="ml-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap">
                    Upload
                  </span>
                </div>
              </>
            )}

            {/* Final Connector */}
            <div className="w-8 sm:w-12 lg:w-16 xl:w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded transition-all duration-300">
              <div
                className={`h-full bg-blue-600 dark:bg-blue-400 rounded transition-all duration-500 ${
                  step === "template" ? "w-full" : "w-0"
                }`}
              />
            </div>

            {/* Step 3/4 */}
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
                {formData.dataSourceType === "upload" ? "4" : "3"}
              </div>
              <span className="ml-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap">
                Template
              </span>
            </div>
          </div>
        </div>{" "}
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
                      className="block text-sm sm:text-base font-medium mb-2 lg:mb-3 text-gray-700 dark:text-gray-300"
                    >
                      Dashboard Name *
                    </label>
                    <input
                      type="text"
                      id="name"
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
                      className="block text-sm sm:text-base font-medium mb-2 lg:mb-3 text-gray-700 dark:text-gray-300"
                    >
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
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

            {step === "datasource" && (
              <div className="animate-fade-in w-full">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-gray-900 dark:text-gray-100">
                  Choose Data Source
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                  {DATA_SOURCES.map((source) => (
                    <div
                      key={source.id}
                      className={`relative p-4 sm:p-6 lg:p-8 border-2 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-200 hover:shadow-xl ${
                        formData.dataSourceType === source.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-xl scale-105"
                          : source.available
                            ? "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:scale-102"
                            : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-50"
                      }`}
                      onClick={() => {
                        if (source.available) {
                          setFormData((prev) => ({
                            ...prev,
                            dataSourceType: source.id as any,
                          }));
                        }
                      }}
                    >
                      {!source.available && (
                        <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                          Coming Soon
                        </div>
                      )}

                      <div className="text-2xl sm:text-3xl lg:text-4xl mb-3 lg:mb-4">
                        {source.icon}
                      </div>
                      <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-2 lg:mb-3 text-gray-900 dark:text-gray-100">
                        {source.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        {source.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "upload" && (
              <div className="animate-fade-in w-full">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-gray-900 dark:text-gray-100">
                  Upload Your Data
                </h2>
                <DataImport
                  onDataImport={(data) => {
                    console.log("Data imported:", data);
                    setUploadedData(data);
                    handleStepTransition("template");
                  }}
                  onCancel={() => handleStepTransition("datasource")}
                />
              </div>
            )}

            {step === "template" && (
              <div className="animate-fade-in w-full">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8 text-gray-900 dark:text-gray-100">
                  Select Template
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                  {SAMPLE_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 sm:p-6 lg:p-8 border-2 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-200 hover:shadow-xl ${
                        formData.template === template.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-xl scale-105"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:scale-102"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          template: template.id,
                        }))
                      }
                    >
                      <div className="text-2xl sm:text-3xl lg:text-4xl mb-3 lg:mb-4">
                        {template.preview}
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
