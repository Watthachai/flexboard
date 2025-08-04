"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Building2,
  Mail,
  Users,
  Shield,
  Database,
  Eye,
  Download,
  Clock,
} from "lucide-react";

interface GenerateLicenseModalProps {
  onGenerate: (licenseData: LicenseFormData) => Promise<void>;
  isGenerating: boolean;
  children: React.ReactNode;
}

export interface LicenseFormData {
  companyName: string;
  email: string;
  features: string[];
  dashboardIds?: string[];
  maxConcurrentUsers: number;
  expiryDate: string;
  notes?: string;
}

const AVAILABLE_FEATURES = [
  {
    id: "dashboard-viewer",
    label: "Dashboard Viewer",
    icon: Eye,
    description: "View and interact with dashboards",
  },
  {
    id: "data-export",
    label: "Data Export",
    icon: Download,
    description: "Export data and reports",
  },
  {
    id: "data-analysis",
    label: "Data Analysis",
    icon: Database,
    description: "Advanced analytics and filtering",
  },
  {
    id: "admin-panel",
    label: "Admin Panel",
    icon: Shield,
    description: "Administrative functions",
  },
];

const PRESET_DURATIONS = [
  { label: "1 Month", months: 1 },
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "1 Year", months: 12 },
  { label: "2 Years", months: 24 },
];

export default function GenerateLicenseModal({
  onGenerate,
  isGenerating,
  children,
}: GenerateLicenseModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<LicenseFormData>({
    companyName: "",
    email: "",
    features: ["dashboard-viewer"],
    maxConcurrentUsers: 5,
    expiryDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else {
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        newErrors.expiryDate = "Expiry date must be in the future";
      }
    }

    if (formData.maxConcurrentUsers < 1) {
      newErrors.maxConcurrentUsers = "Must allow at least 1 concurrent user";
    }

    if (formData.features.length === 0) {
      newErrors.features = "Please select at least one feature";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onGenerate(formData);
      setOpen(false);
      // Reset form
      setFormData({
        companyName: "",
        email: "",
        features: ["dashboard-viewer"],
        maxConcurrentUsers: 5,
        expiryDate: "",
        notes: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to generate license:", error);
    }
  };

  const handleFeatureToggle = (featureId: string) => {
    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter((f) => f !== featureId)
      : [...formData.features, featureId];

    setFormData({ ...formData, features: newFeatures });
  };

  const setPresetDuration = (months: number) => {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    setFormData({
      ...formData,
      expiryDate: expiryDate.toISOString().split("T")[0],
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            Generate OnPrem License
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Create a new secure license key for OnPrem dashboard deployment.
            This license will control access and features for the customer's
            installation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="e.g., Acme Corporation"
                  className={errors.companyName ? "border-red-500" : ""}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Authorized Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="admin@company.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* License Configuration */}
          <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              License Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Concurrent Users *</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxConcurrentUsers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxConcurrentUsers: parseInt(e.target.value) || 1,
                    })
                  }
                  className={errors.maxConcurrentUsers ? "border-red-500" : ""}
                />
                {errors.maxConcurrentUsers && (
                  <p className="text-sm text-red-600">
                    {errors.maxConcurrentUsers}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  min={getMinDate()}
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className={errors.expiryDate ? "border-red-500" : ""}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-600">{errors.expiryDate}</p>
                )}
              </div>
            </div>

            {/* Preset Duration Buttons */}
            <div className="space-y-2">
              <Label>Quick Duration Presets</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_DURATIONS.map((preset) => (
                  <Button
                    key={preset.months}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetDuration(preset.months)}
                    className="text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Features Selection */}
          <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Available Features *
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_FEATURES.map((feature) => {
                const Icon = feature.icon;
                const isSelected = formData.features.includes(feature.id);

                return (
                  <div
                    key={feature.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleFeatureToggle(feature.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-md ${isSelected ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.label}</span>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.features && (
              <p className="text-sm text-red-600">{errors.features}</p>
            )}
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional information or special requirements..."
              rows={3}
            />
          </div>

          {/* Summary */}
          {formData.companyName && formData.email && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
              <h4 className="font-medium mb-2">License Summary</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Company:</strong> {formData.companyName}
                </p>
                <p>
                  <strong>Contact:</strong> {formData.email}
                </p>
                <p>
                  <strong>Max Users:</strong> {formData.maxConcurrentUsers}
                </p>
                <p>
                  <strong>Features:</strong> {formData.features.length} selected
                </p>
                {formData.expiryDate && (
                  <p>
                    <strong>Valid Until:</strong>{" "}
                    {new Date(formData.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isGenerating}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Generate License
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
