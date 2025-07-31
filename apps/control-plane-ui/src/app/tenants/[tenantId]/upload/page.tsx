/**
 * XML Upload Page
 * หน้าสำหรับอัปโหลดไฟล์ XML ข้อมูล Inventory
 */

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface UploadStatus {
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
  progress?: number;
  fileName?: string;
  fileSize?: number;
}

export default function XMLUploadPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
  });
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".xml")) {
      setUploadStatus({
        status: "error",
        message: "Please select an XML file (.xml extension required)",
      });
      return;
    }

    setUploadStatus({
      status: "uploading",
      progress: 0,
      fileName: file.name,
      fileSize: file.size,
    });

    try {
      // อ่านไฟล์เป็น text content
      const xmlContent = await file.text();

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadStatus((prev) => ({
          ...prev,
          progress: Math.min((prev.progress || 0) + 10, 90),
        }));
      }, 200);

      const response = await fetch(`/api/tenants/${tenantId}/upload-xml`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xmlContent: xmlContent,
          fileName: file.name,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();

      setUploadStatus({
        status: "success",
        progress: 100,
        fileName: result.fileName,
        fileSize: result.fileSize,
        message:
          "XML file uploaded successfully! You can now create dashboards with your data.",
      });
    } catch (error) {
      setUploadStatus({
        status: "error",
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadSampleXML = () => {
    window.open(`/api/tenants/${tenantId}/sample-xml`, "_blank");
  };

  const goToDashboards = () => {
    router.push(`/tenants/${tenantId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={`/tenants/${tenantId}`}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboards
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Upload Inventory Data
          </h1>
          <p className="text-gray-600 mt-1">
            Upload your XML inventory file to enable data-driven dashboards
          </p>
        </div>

        {/* Sample XML Download */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">
                  Need a sample XML format?
                </h3>
                <p className="text-sm text-blue-700">
                  Download our sample XML file to see the expected data
                  structure
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={downloadSampleXML}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Download className="h-4 w-4 mr-1" />
              Download Sample
            </Button>
          </div>
        </Card>

        {/* Upload Area */}
        <Card className="p-8">
          {uploadStatus.status === "idle" && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
            >
              <Upload
                className={`h-12 w-12 mx-auto mb-4 ${
                  dragActive ? "text-blue-500" : "text-gray-400"
                }`}
              />

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload your XML file
              </h3>
              <p className="text-gray-600 mb-6">
                Drag and drop your XML file here, or click to browse
              </p>

              <input
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
                  <Upload className="h-4 w-4 mr-1" />
                  Choose XML File
                </Button>
              </label>

              <p className="text-xs text-gray-500 mt-4">
                Supported format: XML files (.xml) up to 10MB
              </p>
            </div>
          )}

          {uploadStatus.status === "uploading" && (
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Uploading {uploadStatus.fileName}
              </h3>
              <p className="text-gray-600 mb-4">
                File size:{" "}
                {uploadStatus.fileSize
                  ? formatFileSize(uploadStatus.fileSize)
                  : "Unknown"}
              </p>
              <Progress
                value={uploadStatus.progress || 0}
                className="w-full max-w-md mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">
                {uploadStatus.progress || 0}% complete
              </p>
            </div>
          )}

          {uploadStatus.status === "success" && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Successful!
              </h3>
              <p className="text-gray-600 mb-4">{uploadStatus.message}</p>

              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-4 text-sm text-green-800">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {uploadStatus.fileName}
                  </div>
                  <div>
                    {uploadStatus.fileSize
                      ? formatFileSize(uploadStatus.fileSize)
                      : "Unknown size"}
                  </div>
                </div>
              </div>

              <div className="space-x-3">
                <Button
                  onClick={goToDashboards}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Go to Dashboards
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setUploadStatus({ status: "idle" })}
                >
                  Upload Another File
                </Button>
              </div>
            </div>
          )}

          {uploadStatus.status === "error" && (
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Failed
              </h3>

              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {uploadStatus.message}
                </AlertDescription>
              </Alert>

              <div className="space-x-3">
                <Button
                  onClick={() => setUploadStatus({ status: "idle" })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>

                <Button variant="outline" onClick={downloadSampleXML}>
                  <Download className="h-4 w-4 mr-1" />
                  Download Sample
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="p-6 mt-6">
          <h3 className="font-medium text-gray-900 mb-3">
            XML File Requirements
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>File Format:</strong> XML file with .xml extension
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Required Sections:</strong> Products, StockItems, and
                ConsumptionHistory
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>File Size:</strong> Maximum 10MB per file
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Data Content:</strong> Product information, inventory
                levels, lot tracking, and consumption history
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
