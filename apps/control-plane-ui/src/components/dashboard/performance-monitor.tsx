/**
 * Performance Optimization & Monitoring
 * Dashboard performance analytics and optimization features
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Zap,
  Database,
  Cpu,
  MemoryStick,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wifi,
  Gauge,
  BarChart3,
  Settings,
  Wrench,
} from "lucide-react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  apiLatency: number;
  dataTransfer: number;
  fps: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: Date;
}

interface OptimizationSuggestion {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  category: "performance" | "memory" | "network" | "user-experience";
  autoFixAvailable: boolean;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);

  // Performance monitoring hook
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        const newMetrics: PerformanceMetrics = {
          renderTime: Math.random() * 50 + 10, // 10-60ms
          memoryUsage: Math.random() * 100 + 50, // 50-150MB
          apiLatency: Math.random() * 200 + 50, // 50-250ms
          dataTransfer: Math.random() * 1000 + 100, // 100-1100KB
          fps: 60 - Math.random() * 10, // 50-60 FPS
          bundleSize: 2500 + Math.random() * 500, // 2.5-3MB
          cacheHitRate: 0.8 + Math.random() * 0.2, // 80-100%
          errorRate: Math.random() * 0.05, // 0-5%
          timestamp: new Date(),
        };

        setCurrentMetrics(newMetrics);
        setMetrics((prev) => [...prev.slice(-49), newMetrics]); // Keep last 50 metrics

        // Generate suggestions based on metrics
        generateOptimizationSuggestions(newMetrics);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const generateOptimizationSuggestions = useCallback(
    (metrics: PerformanceMetrics) => {
      const newSuggestions: OptimizationSuggestion[] = [];

      if (metrics.renderTime > 40) {
        newSuggestions.push({
          id: "slow-render",
          type: "warning",
          title: "Slow rendering detected",
          description:
            "Dashboard rendering is taking longer than optimal. Consider reducing widget complexity.",
          impact: "medium",
          effort: "medium",
          category: "performance",
          autoFixAvailable: true,
        });
      }

      if (metrics.memoryUsage > 120) {
        newSuggestions.push({
          id: "high-memory",
          type: "critical",
          title: "High memory usage",
          description:
            "Memory consumption is above recommended levels. Consider implementing data virtualization.",
          impact: "high",
          effort: "high",
          category: "memory",
          autoFixAvailable: false,
        });
      }

      if (metrics.apiLatency > 200) {
        newSuggestions.push({
          id: "slow-api",
          type: "warning",
          title: "Slow API responses",
          description:
            "API calls are taking longer than expected. Enable caching or optimize queries.",
          impact: "medium",
          effort: "low",
          category: "network",
          autoFixAvailable: true,
        });
      }

      if (metrics.fps < 55) {
        newSuggestions.push({
          id: "low-fps",
          type: "info",
          title: "Frame rate optimization",
          description:
            "Consider reducing animation complexity for smoother interactions.",
          impact: "low",
          effort: "low",
          category: "user-experience",
          autoFixAvailable: true,
        });
      }

      setSuggestions(newSuggestions);
    },
    []
  );

  const applyAutoFix = useCallback((suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    // Simulate applying the fix
    console.log(`Auto-fixing: ${suggestionId}`);
  }, []);

  const performanceScore = useMemo(() => {
    if (!currentMetrics) return 0;

    const scores = {
      render: Math.max(0, 100 - (currentMetrics.renderTime - 10) * 2),
      memory: Math.max(0, 100 - (currentMetrics.memoryUsage - 50) * 0.5),
      api: Math.max(0, 100 - (currentMetrics.apiLatency - 50) * 0.3),
      fps: Math.min(100, (currentMetrics.fps / 60) * 100),
      cache: currentMetrics.cacheHitRate * 100,
    };

    return Math.round(
      (scores.render + scores.memory + scores.api + scores.fps + scores.cache) /
        5
    );
  }, [currentMetrics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Performance Monitor
          </h2>
          <p className="text-gray-600">
            Monitor and optimize dashboard performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant={isMonitoring ? "default" : "outline"}
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            <Activity className="w-4 h-4 mr-2" />
            {isMonitoring ? "Monitoring..." : "Start Monitoring"}
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      {currentMetrics && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Score
              </h3>
              <p className="text-gray-600">
                Overall dashboard performance rating
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}
              >
                {performanceScore}
              </div>
              <Badge className={getScoreBadgeColor(performanceScore)}>
                {performanceScore >= 80
                  ? "Excellent"
                  : performanceScore >= 60
                    ? "Good"
                    : "Poor"}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          <TabsTrigger value="suggestions">Optimization</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Live Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {currentMetrics ? (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Render Time"
                  value={`${currentMetrics.renderTime.toFixed(1)}ms`}
                  icon={Zap}
                  trend={
                    currentMetrics.renderTime < 30
                      ? "good"
                      : currentMetrics.renderTime < 50
                        ? "warning"
                        : "critical"
                  }
                />
                <MetricCard
                  title="Memory Usage"
                  value={`${currentMetrics.memoryUsage.toFixed(1)}MB`}
                  icon={MemoryStick}
                  trend={
                    currentMetrics.memoryUsage < 100
                      ? "good"
                      : currentMetrics.memoryUsage < 130
                        ? "warning"
                        : "critical"
                  }
                />
                <MetricCard
                  title="API Latency"
                  value={`${currentMetrics.apiLatency.toFixed(0)}ms`}
                  icon={Database}
                  trend={
                    currentMetrics.apiLatency < 150
                      ? "good"
                      : currentMetrics.apiLatency < 200
                        ? "warning"
                        : "critical"
                  }
                />
                <MetricCard
                  title="Frame Rate"
                  value={`${currentMetrics.fps.toFixed(0)} FPS`}
                  icon={Gauge}
                  trend={
                    currentMetrics.fps > 55
                      ? "good"
                      : currentMetrics.fps > 45
                        ? "warning"
                        : "critical"
                  }
                />
              </div>

              {/* Detailed Metrics */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-gray-600">Data Transfer</div>
                    <div className="text-xl font-semibold">
                      {(currentMetrics.dataTransfer / 1000).toFixed(1)}MB
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Bundle Size</div>
                    <div className="text-xl font-semibold">
                      {(currentMetrics.bundleSize / 1000).toFixed(1)}MB
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Cache Hit Rate</div>
                    <div className="text-xl font-semibold">
                      {(currentMetrics.cacheHitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                    <div className="text-xl font-semibold">
                      {(currentMetrics.errorRate * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </Card>

              {/* Performance Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Performance Trends
                </h3>
                <div className="h-64 flex items-end justify-between space-x-1">
                  {metrics.slice(-20).map((metric, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-t w-full"
                      style={{
                        height: `${(metric.renderTime / 60) * 100}%`,
                        minHeight: "4px",
                      }}
                      title={`${metric.renderTime.toFixed(1)}ms`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Render time (last 20 measurements)
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Performance Monitoring Disabled
              </h3>
              <p className="text-gray-500 mb-4">
                Click "Start Monitoring" to begin tracking performance metrics
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Optimization Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Optimization Suggestions</h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm">Auto-apply fixes:</label>
              <input
                type="checkbox"
                checked={autoOptimize}
                onChange={(e) => setAutoOptimize(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>

          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {suggestion.type === "critical" && (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        {suggestion.type === "warning" && (
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        )}
                        {suggestion.type === "info" && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <Badge variant="outline">{suggestion.category}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Impact: {suggestion.impact}</span>
                        <span>Effort: {suggestion.effort}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {suggestion.autoFixAvailable && (
                        <Button
                          size="sm"
                          onClick={() => applyAutoFix(suggestion.id)}
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          Auto Fix
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                All Good!
              </h3>
              <p className="text-gray-500">
                No optimization suggestions at this time
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Real-time monitoring</div>
                  <div className="text-sm text-gray-600">
                    Continuously track performance metrics
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isMonitoring}
                  onChange={(e) => setIsMonitoring(e.target.checked)}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-optimization</div>
                  <div className="text-sm text-gray-600">
                    Automatically apply performance fixes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoOptimize}
                  onChange={(e) => setAutoOptimize(e.target.checked)}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Data virtualization</div>
                  <div className="text-sm text-gray-600">
                    Enable for large datasets
                  </div>
                </div>
                <input type="checkbox" className="rounded" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Lazy loading</div>
                  <div className="text-sm text-gray-600">
                    Load widgets on demand
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  icon: any;
  trend: "good" | "warning" | "critical";
}) {
  const trendColors = {
    good: "text-green-600 bg-green-50 border-green-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <Card className={`p-4 ${trendColors[trend]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <TrendingUp className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{title}</div>
    </Card>
  );
}
