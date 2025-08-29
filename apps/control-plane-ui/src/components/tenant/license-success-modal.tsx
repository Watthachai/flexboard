"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Download,
  Shield,
  Calendar,
  Mail,
  Building2,
  Users,
  Star,
} from "lucide-react";

interface LicenseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseData: {
    licenseKey: string;
    companyName: string;
    email: string;
    features: string[];
    maxConcurrentUsers: number;
    expiryDate: string;
    generatedAt: string;
  };
}

export default function LicenseSuccessModal({
  isOpen,
  onClose,
  licenseData,
}: LicenseSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const downloadLicenseInfo = () => {
    const licenseInfo = {
      licenseKey: licenseData.licenseKey,
      companyName: licenseData.companyName,
      authorizedEmail: licenseData.email,
      features: licenseData.features,
      maxConcurrentUsers: licenseData.maxConcurrentUsers,
      expiryDate: licenseData.expiryDate,
      generatedAt: licenseData.generatedAt,
      instructions: [
        "1. Deploy the OnPrem Agent with this license key",
        "2. Configure the license key in your OnPrem environment",
        "3. Users can now access the dashboard using their authorized credentials",
        "4. Monitor usage and sessions through the Control Plane",
      ],
    };

    const blob = new Blob([JSON.stringify(licenseInfo, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${licenseData.companyName.replace(/\s+/g, "-").toLowerCase()}-license.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFeatures = (features: string[]): string[] => {
    const featureMap: Record<string, string> = {
      "dashboard-viewer": "Dashboard Viewer",
      "data-export": "Data Export",
      "data-analysis": "Data Analysis",
      "admin-panel": "Admin Panel",
    };

    return features.map((f) => featureMap[f] || f);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl text-green-600">
            <div className="p-2 bg-green-100 rounded-full">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            License Generated Successfully!
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Your OnPrem license has been created and is ready for deployment.
            Please save the license key securely and share it with your
            customer.
          </DialogDescription>
        </DialogHeader>{" "}
        <div className="space-y-6">
          {/* Success Animation */}
          <div className="flex justify-center py-6">
            <div className="relative">
              <div className="animate-pulse bg-green-100 rounded-full p-8">
                <Check className="h-16 w-16 text-green-600" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Star className="h-8 w-8 text-yellow-500 animate-bounce" />
              </div>
            </div>
          </div>

          {/* License Key Display */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border-2 border-blue-200">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              License Key
            </h3>
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-md border font-mono">
              <span className="flex-1 text-lg break-all select-all">
                {licenseData.licenseKey}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(licenseData.licenseKey)}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* License Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Company Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Company:</span>
                  <span className="font-medium">{licenseData.companyName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Contact:</span>
                  <span className="font-medium">{licenseData.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Max Users:</span>
                  <Badge variant="secondary">
                    {licenseData.maxConcurrentUsers} users
                  </Badge>
                </div>
              </div>
            </div>

            {/* License Configuration */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                License Configuration
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Valid Until:</span>
                  <span className="font-medium">
                    {new Date(licenseData.expiryDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Generated:</span>
                  <span className="font-medium">
                    {new Date(licenseData.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enabled Features */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-600" />
              Enabled Features
            </h3>
            <div className="flex flex-wrap gap-2">
              {formatFeatures(licenseData.features).map((feature, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-sm py-1 px-3"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Download className="h-4 w-4" />
              Next Steps
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li>
                Save the license key securely - it cannot be retrieved later
              </li>
              <li>Share the license key with your customer securely</li>
              <li>
                Customer configures the OnPrem Agent with this license key
              </li>
              <li>
                Monitor usage and sessions through the Control Plane dashboard
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={downloadLicenseInfo}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download License Info
            </Button>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(licenseData.licenseKey)}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy License Key
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
