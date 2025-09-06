/**
 * Settings Page
 * Contains auto-ingestion monitoring and system preferences
 */

"use client";

import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import OnPremSettings from "../components/OnPremSettings";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <OnPremSettings />
    </DashboardLayout>
  );
}
