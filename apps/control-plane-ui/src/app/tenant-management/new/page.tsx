"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TenantFormData {
  name: string;
  slug: string;
  description?: string;
  apiKey: string;
  isActive: boolean;
  config: {
    theme: "light" | "dark";
    refreshInterval: number;
  };
}

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    slug: "",
    description: "",
    apiKey: "",
    isActive: true,
    config: {
      theme: "light",
      refreshInterval: 300000, // 5 minutes
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const generateApiKey = () => {
    return `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Tenant created:", result);
        router.push("/tenants");
      } else {
        const error = await response.json();
        console.error("Error creating tenant:", error);
        alert("Failed to create tenant. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create tenant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Tenant</h1>
          <p className="text-muted-foreground">
            Create a new client organization
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Tenant Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter tenant name..."
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-2">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tenant-slug"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used in URLs and API calls. Auto-generated from name.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Description
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description..."
              />
            </div>

            {/* API Key */}
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium mb-2"
              >
                API Key *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="apiKey"
                  required
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="API key for this tenant..."
                />
                <Button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      apiKey: generateApiKey(),
                    }))
                  }
                  className="px-4 py-2 text-sm"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium mb-2">
                Theme
              </label>
              <select
                id="theme"
                value={formData.config.theme}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      theme: e.target.value as "light" | "dark",
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Refresh Interval */}
            <div>
              <label
                htmlFor="refreshInterval"
                className="block text-sm font-medium mb-2"
              >
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                id="refreshInterval"
                value={formData.config.refreshInterval / 1000}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      refreshInterval: parseInt(e.target.value) * 1000,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="30"
                max="3600"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Tenant"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/tenants")}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
