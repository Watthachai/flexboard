/**
 * XML Data Status Component
 * แสดงสถานะของข้อมูล XML ที่อัปโหลด และให้เลือก Template ตามข้อมูลที่มี
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Database,
  Download,
  Sparkles,
} from "lucide-react";
import { DashboardManifestService } from "@/services/dashboard-manifest.service";

interface XMLDataStatusProps {
  tenantId: string;
  onTemplateSelect?: (templateType: string, sampleData?: any) => void;
  className?: string;
}

interface DataStatus {
  hasData: boolean;
  fileName?: string;
  fileSize?: number;
  lastModified?: string;
  message: string;
  uploadPath?: string;
}

interface XMLSampleData {
  products: any[];
  categories: string[];
  sampleQuery: string;
  dataPreview: any;
}

export default function XMLDataStatus({
  tenantId,
  onTemplateSelect,
  className = "",
}: XMLDataStatusProps) {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [sampleData, setSampleData] = useState<XMLSampleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    checkDataStatus();
  }, [tenantId]);

  const checkDataStatus = async () => {
    setLoading(true);
    try {
      const status = await DashboardManifestService.getDataStatus(tenantId);
      setDataStatus(status);

      // ถ้ามีข้อมูล ให้โหลด sample data ด้วย
      if (status.hasData) {
        await loadSampleData();
      }
    } catch (error) {
      console.error("Error checking data status:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    setLoadingSample(true);
    try {
      const sample = await DashboardManifestService.getXMLSampleData(tenantId);
      setSampleData(sample);
    } catch (error) {
      console.error("Error loading sample data:", error);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    onTemplateSelect?.(templateType, sampleData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
          <span className="text-gray-600">Checking data status...</span>
        </div>
      </Card>
    );
  }

  if (!dataStatus) {
    return (
      <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Failed to check data status</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Data Source Status
            </h3>
          </div>

          {dataStatus.hasData && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Data Available
            </Badge>
          )}
        </div>

        {/* Status Information */}
        {dataStatus.hasData ? (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {dataStatus.message}
              </AlertDescription>
            </Alert>

            {/* File Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">File Name:</span>
                  <div className="flex items-center mt-1">
                    <FileText className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-gray-900">{dataStatus.fileName}</span>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">File Size:</span>
                  <div className="text-gray-900 mt-1">
                    {dataStatus.fileSize
                      ? formatFileSize(dataStatus.fileSize)
                      : "Unknown"}
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="font-medium text-gray-700">
                    Last Modified:
                  </span>
                  <div className="text-gray-900 mt-1">
                    {dataStatus.lastModified
                      ? new Date(dataStatus.lastModified).toLocaleString(
                          "th-TH"
                        )
                      : "Unknown"}
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Data Preview */}
            {sampleData && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Data Preview</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>Products: {sampleData.products.length} items</div>
                  <div>Categories: {sampleData.categories.join(", ")}</div>
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                Choose Dashboard Template
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleTemplateSelect("manager-overview")}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  disabled={loadingSample}
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Manager Overview</span>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 text-left">
                    Executive dashboard with KPIs, stock aging, and FIFO
                    analysis
                  </p>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleTemplateSelect("inventory")}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  disabled={loadingSample}
                >
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Inventory Basic</span>
                  </div>
                  <p className="text-xs text-gray-600 text-left">
                    Basic inventory tracking with tables and simple charts
                  </p>
                </Button>
              </div>
            </div>

            {/* Refresh Data Button */}
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={checkDataStatus}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-1" />
                Refresh Data Status
              </Button>
            </div>
          </div>
        ) : (
          // No Data State
          <div className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                {dataStatus.message}
              </AlertDescription>
            </Alert>

            <div className="text-center py-6">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No Data Source Found
              </h4>
              <p className="text-gray-600 mb-4">
                Upload your inventory XML file to get started with data-driven
                dashboards
              </p>

              {dataStatus.uploadPath && (
                <Link href={`/tenants/${tenantId}/upload`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Data File
                  </Button>
                </Link>
              )}
            </div>

            {/* Default Templates */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                Or Start with Basic Template
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleTemplateSelect("basic")}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Basic Template</span>
                  </div>
                  <p className="text-xs text-gray-600 text-left">
                    Empty dashboard template to start from scratch
                  </p>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleTemplateSelect("sales")}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Sales Template</span>
                  </div>
                  <p className="text-xs text-gray-600 text-left">
                    Sample sales dashboard with mock data
                  </p>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
