/**
 * Hook for fetching and managing widget data
 */

import { useState, useEffect, useRef } from "react";
import { widgetDataService, WidgetData } from "@/services/widget-data.service";

export function useWidgetData(
  widgetId: string,
  widgetType: string,
  config: any
) {
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!widgetId || !widgetType) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const widgetData = await widgetDataService.fetchWidgetData(
          widgetId,
          widgetType,
          config
        );

        if (mountedRef.current) {
          setData(widgetData);
          setLoading(widgetData.isLoading);
          setError(widgetData.error || null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          setLoading(false);
        }
      }
    };

    fetchData();

    // Setup auto-refresh if configured
    if (config.refreshInterval && config.refreshInterval > 0) {
      widgetDataService.setupAutoRefresh(
        widgetId,
        widgetType,
        config,
        config.refreshInterval
      );
    }

    return () => {
      widgetDataService.clearAutoRefresh(widgetId);
    };
  }, [widgetId, widgetType, config]);

  const refresh = async () => {
    if (!widgetId || !widgetType) return;

    try {
      setLoading(true);
      const widgetData = await widgetDataService.fetchWidgetData(
        widgetId,
        widgetType,
        { ...config, forceRefresh: true }
      );

      if (mountedRef.current) {
        setData(widgetData);
        setLoading(widgetData.isLoading);
        setError(widgetData.error || null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to refresh data");
        setLoading(false);
      }
    }
  };

  return {
    data: data?.data,
    loading,
    error,
    refresh,
    lastUpdated: data?.lastUpdated,
  };
}
