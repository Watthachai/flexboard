"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_TEMPLATES,
  DashboardTemplate,
} from "@/data/dashboard-templates";

interface SmartTemplateSelectorProps {
  dataSourceType: "upload" | "database" | "api" | "mock";
  selectedDataset?: string; // ID ของ sample dataset ที่เลือก
  onTemplateSelect: (template: DashboardTemplate) => void;
  onCancel: () => void;
}

export default function SmartTemplateSelector({
  dataSourceType,
  selectedDataset,
  onTemplateSelect,
  onCancel,
}: SmartTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("blank_dashboard");

  // Smart template recommendation based on data
  const getRecommendedTemplates = () => {
    const allTemplates = [...DASHBOARD_TEMPLATES];

    // ถ้าเลือก sample dataset PVI
    if (selectedDataset === "pvi_explosives") {
      const inventoryTemplate = allTemplates.find(
        (t) => t.id === "inventory_overview"
      );
      if (inventoryTemplate) {
        return [
          inventoryTemplate,
          ...allTemplates.filter((t) => t.id !== "inventory_overview"),
        ];
      }
    }

    // ถ้าเลือก sales dataset
    if (selectedDataset === "sales") {
      const salesTemplate = allTemplates.find(
        (t) => t.id === "sales_analytics"
      );
      if (salesTemplate) {
        return [
          salesTemplate,
          ...allTemplates.filter((t) => t.id !== "sales_analytics"),
        ];
      }
    }

    // Default order
    return allTemplates;
  };

  const recommendedTemplates = getRecommendedTemplates();

  const handleSelect = () => {
    const template = DASHBOARD_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (template) {
      onTemplateSelect(template);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">เลือก Dashboard Template</h3>
        <p className="text-gray-600">
          เลือกรูปแบบ Dashboard ที่เหมาะสมกับข้อมูลของคุณ
        </p>
        {selectedDataset === "pvi_explosives" && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-800 font-medium">
              💡 แนะนำ: Inventory Overview
            </div>
            <div className="text-blue-600 text-sm">
              เหมาะสำหรับข้อมูล PVI ที่มีรายละเอียดสินค้าและจำนวน
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {recommendedTemplates.map((template, index) => (
          <div
            key={template.id}
            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            {/* Recommended Badge */}
            {index === 0 &&
              selectedDataset &&
              template.id !== "blank_dashboard" && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  แนะนำ
                </div>
              )}

            <div className="flex items-start space-x-3">
              <div className="text-3xl">{template.icon}</div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.categories.map((category) => (
                    <span
                      key={category}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                {/* Widget Count */}
                <div className="text-xs text-gray-500">
                  {template.widgets.length === 0
                    ? "เริ่มต้นจากหน้าเปล่า"
                    : `${template.widgets.length} widgets ที่พร้อมใช้งาน`}
                </div>
              </div>
            </div>

            {/* Preview widgets */}
            {selectedTemplate === template.id &&
              template.widgets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-medium mb-2 text-sm">
                    Widgets ที่จะถูกสร้าง:
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {template.widgets.slice(0, 4).map((widget, index) => (
                      <div
                        key={index}
                        className="text-xs p-2 bg-gray-50 rounded"
                      >
                        <div className="font-medium">{widget.title}</div>
                        <div className="text-gray-500 capitalize">
                          {widget.type}
                        </div>
                      </div>
                    ))}
                    {template.widgets.length > 4 && (
                      <div className="text-xs text-gray-500 flex items-center justify-center">
                        +{template.widgets.length - 4} อื่นๆ
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button
          onClick={handleSelect}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create Dashboard
        </Button>
      </div>
    </Card>
  );
}
