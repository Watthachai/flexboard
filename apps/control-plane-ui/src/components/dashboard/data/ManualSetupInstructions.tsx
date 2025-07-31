/**
 * Manual Data Setup Instructions - Fallback when QuickSetupHelper is not available
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  PieChart,
  BarChart3,
  Table,
  Database,
  Upload,
  ArrowRight,
} from "lucide-react";

interface ManualSetupInstructionsProps {
  widgetType: string;
}

export function ManualSetupInstructions({
  widgetType,
}: ManualSetupInstructionsProps) {
  const getInstructions = () => {
    switch (widgetType) {
      case "pie-chart":
        return {
          icon: PieChart,
          title: "Setup Pie Chart with Uploaded Data",
          steps: [
            'เลือก "Uploaded Data" จาก Data Source Type',
            "เลือก columns ที่ต้องการ (category และ value)",
            "ตั้งค่า Group By เป็น category column",
            "ตั้งค่า Aggregation เป็น sum สำหรับ value column",
          ],
        };
      case "bar-chart":
        return {
          icon: BarChart3,
          title: "Setup Bar Chart with Uploaded Data",
          steps: [
            'เลือก "Uploaded Data" จาก Data Source Type',
            "เลือก columns ที่ต้องการ",
            "ตั้งค่า Group By และ Aggregation",
          ],
        };
      case "table":
        return {
          icon: Table,
          title: "Setup Table with Uploaded Data",
          steps: [
            'เลือก "Uploaded Data" จาก Data Source Type',
            "เลือก columns ที่ต้องการแสดงในตาราง",
          ],
        };
      default:
        return {
          icon: Database,
          title: "Setup Widget with Uploaded Data",
          steps: [
            'เลือก "Uploaded Data" จาก Data Source Type',
            "เลือก columns และตั้งค่าตามต้องการ",
          ],
        };
    }
  };

  const instructions = getInstructions();
  const IconComponent = instructions.icon;

  return (
    <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
      <div className="flex items-center mb-3">
        <Info className="w-5 h-5 text-amber-500 mr-2" />
        <h4 className="font-medium text-amber-900 dark:text-amber-100">
          Manual Setup Required
        </h4>
      </div>

      <div className="flex items-start mb-4">
        <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center mr-3 flex-shrink-0">
          <IconComponent className="w-4 h-4 text-white" />
        </div>
        <div>
          <h5 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
            {instructions.title}
          </h5>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            ตรวจพบข้อมูลที่อัปโหลดแล้ว ทำตามขั้นตอนเพื่อใช้ข้อมูลกับ widget
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {instructions.steps.map((step, index) => (
          <div key={index} className="flex items-start text-sm">
            <Badge
              variant="secondary"
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0"
            >
              {index + 1}
            </Badge>
            <span className="text-amber-800 dark:text-amber-200">{step}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border flex items-center">
        <Upload className="w-4 h-4 text-green-500 mr-2" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          ข้อมูลที่อัปโหลดพร้อมใช้งาน
        </span>
        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
      </div>
    </Card>
  );
}
