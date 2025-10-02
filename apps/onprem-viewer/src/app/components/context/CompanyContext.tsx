/**
 * Company Context
 * Provides available companies data across components
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CompanyContextType {
  availableCompanies: string[];
  setAvailableCompanies: (companies: string[]) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load companies from localStorage on startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Try to load from uploaded data first
        const uploadedData = localStorage.getItem("uploadedData");
        if (uploadedData) {
          const data = JSON.parse(uploadedData);
          const companies = [
            ...new Set(
              data.map((item: { corp?: string }) => item.corp).filter(Boolean)
            ),
          ] as string[];
          setAvailableCompanies(companies);
        } else {
          // Fallback to API if no localStorage data
          fetchCompaniesFromAPI();
        }
      } catch (error) {
        console.error("Failed to load companies from localStorage:", error);
        fetchCompaniesFromAPI();
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchCompaniesFromAPI = async () => {
    try {
      const response = await fetch("/api/inventory/raw?noPagination=true");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.rows) {
          const uniqueCorps = [
            ...new Set(result.rows.map((r: { corp?: string }) => r.corp)),
          ]
            .filter(Boolean)
            .sort() as string[];
          setAvailableCompanies(uniqueCorps);
        }
      }
    } catch (error) {
      console.error("Failed to fetch companies from API:", error);
    }
  };

  const value: CompanyContextType = {
    availableCompanies,
    setAvailableCompanies,
    isLoading,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
