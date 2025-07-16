/**
 * Dashboard Template Marketplace
 * Pre-built dashboard templates for different industries
 */

"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  Download,
  Eye,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { DashboardConfig } from "@/types/dashboard-editor";

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  thumbnail: string;
  rating: number;
  downloads: number;
  author: string;
  isPremium: boolean;
  tags: string[];
  config: DashboardConfig;
  previewUrl?: string;
}

const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "sales-overview",
    name: "Sales Performance Dashboard",
    description:
      "Complete sales analytics with KPIs, trends, and performance metrics",
    category: "Sales",
    industry: "E-commerce",
    thumbnail: "/templates/sales-dashboard.png",
    rating: 4.8,
    downloads: 1247,
    author: "FlexBoard Team",
    isPremium: false,
    tags: ["sales", "kpi", "analytics", "performance"],
    config: {
      id: "template-sales",
      name: "Sales Performance Dashboard",
      widgets: [
        {
          id: "revenue-kpi",
          type: "kpi",
          title: "Total Revenue",
          x: 0,
          y: 0,
          width: 3,
          height: 2,
          config: { kpiType: "revenue", dataSource: "api" },
        },
        {
          id: "orders-kpi",
          type: "kpi",
          title: "Total Orders",
          x: 3,
          y: 0,
          width: 3,
          height: 2,
          config: { kpiType: "orders", dataSource: "api" },
        },
        {
          id: "conversion-kpi",
          type: "kpi",
          title: "Conversion Rate",
          x: 6,
          y: 0,
          width: 3,
          height: 2,
          config: { kpiType: "conversion", dataSource: "api" },
        },
        {
          id: "sales-trend",
          type: "line-chart",
          title: "Sales Trend",
          x: 0,
          y: 2,
          width: 6,
          height: 4,
          config: { chartType: "line", dataSource: "api" },
        },
        {
          id: "product-performance",
          type: "bar-chart",
          title: "Product Performance",
          x: 6,
          y: 2,
          width: 6,
          height: 4,
          config: { chartType: "bar", dataSource: "api" },
        },
      ],
      layout: { columns: 12, rows: 8, gridSize: 60 },
      theme: "light",
    },
  },
  {
    id: "marketing-analytics",
    name: "Marketing Analytics Hub",
    description: "Track campaign performance, customer acquisition, and ROI",
    category: "Marketing",
    industry: "Digital Marketing",
    thumbnail: "/templates/marketing-dashboard.png",
    rating: 4.6,
    downloads: 892,
    author: "Marketing Pro",
    isPremium: true,
    tags: ["marketing", "campaigns", "roi", "analytics"],
    config: {
      id: "template-marketing",
      name: "Marketing Analytics Hub",
      widgets: [
        {
          id: "cac-kpi",
          type: "kpi",
          title: "Customer Acquisition Cost",
          x: 0,
          y: 0,
          width: 3,
          height: 2,
          config: { kpiType: "cac", dataSource: "api" },
        },
        {
          id: "roas-kpi",
          type: "kpi",
          title: "Return on Ad Spend",
          x: 3,
          y: 0,
          width: 3,
          height: 2,
          config: { kpiType: "roas", dataSource: "api" },
        },
        {
          id: "campaign-performance",
          type: "pie-chart",
          title: "Campaign Performance",
          x: 0,
          y: 2,
          width: 6,
          height: 4,
          config: { chartType: "pie", dataSource: "api" },
        },
      ],
      layout: { columns: 12, rows: 8, gridSize: 60 },
      theme: "dark",
    },
  },
  {
    id: "financial-overview",
    name: "Financial Overview Dashboard",
    description:
      "Monitor financial health with revenue, expenses, and profit margins",
    category: "Finance",
    industry: "Financial Services",
    thumbnail: "/templates/financial-dashboard.png",
    rating: 4.9,
    downloads: 2156,
    author: "FinTech Solutions",
    isPremium: false,
    tags: ["finance", "revenue", "expenses", "profit"],
    config: {
      id: "template-financial",
      name: "Financial Overview Dashboard",
      widgets: [
        {
          id: "revenue-chart",
          type: "line-chart",
          title: "Revenue vs Expenses",
          x: 0,
          y: 0,
          width: 8,
          height: 4,
          config: { chartType: "line", dataSource: "api" },
        },
        {
          id: "profit-margin",
          type: "kpi",
          title: "Profit Margin",
          x: 8,
          y: 0,
          width: 4,
          height: 2,
          config: { kpiType: "margin", dataSource: "api" },
        },
      ],
      layout: { columns: 12, rows: 8, gridSize: 60 },
      theme: "light",
    },
  },
];

const CATEGORIES = ["All", "Sales", "Marketing", "Finance", "Operations", "HR"];
const INDUSTRIES = [
  "All",
  "E-commerce",
  "Digital Marketing",
  "Financial Services",
  "SaaS",
  "Healthcare",
];

interface DashboardTemplateMarketplaceProps {
  onSelectTemplate: (template: DashboardTemplate) => void;
  onClose: () => void;
}

export default function DashboardTemplateMarketplace({
  onSelectTemplate,
  onClose,
}: DashboardTemplateMarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const filteredTemplates = DASHBOARD_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    const matchesIndustry =
      selectedIndustry === "All" || template.industry === selectedIndustry;
    const matchesPremium = !showPremiumOnly || template.isPremium;

    return (
      matchesSearch && matchesCategory && matchesIndustry && matchesPremium
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Template Marketplace
            </h2>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showPremiumOnly}
                onChange={(e) => setShowPremiumOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Premium only</span>
            </label>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate(template)}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No templates found</div>
              <div className="text-gray-500 text-sm mt-2">
                Try adjusting your search criteria
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: DashboardTemplate;
  onSelect: () => void;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <div className="p-4">
        {/* Template Preview */}
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          <div className="text-gray-400">
            <BarChart3 className="w-8 h-8" />
          </div>
        </div>

        {/* Template Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {template.name}
            </h3>
            {template.isPremium && (
              <Badge variant="secondary" className="ml-2">
                Pro
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>

          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{template.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="w-3 h-3" />
              <span>{template.downloads}</span>
            </div>
            <span>by {template.author}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement preview
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" className="flex-1" onClick={onSelect}>
            Use Template
          </Button>
        </div>
      </div>
    </Card>
  );
}

export { DASHBOARD_TEMPLATES };
