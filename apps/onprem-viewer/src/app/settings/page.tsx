/**
 * Settings Page
 * Contains file upload functionality and system preferences
 */

"use client";

import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import Settings from "../components/Settings";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Settings />
    </DashboardLayout>
  );
}
