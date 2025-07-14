"use client"; // จำเป็นสำหรับ Recharts และการ fetch ข้อมูลฝั่ง Client

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// กำหนด Type ของข้อมูลที่เราคาดว่าจะได้รับ
interface SalesData {
  month: string;
  total_sales: number;
}

interface ProductData {
  product_name: string;
  revenue: number;
}

interface KPIData {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

// Component สำหรับแสดง KPI Cards
function KPICard({
  title,
  value,
  suffix = "",
}: {
  title: string;
  value: number;
  suffix?: string;
}) {
  const formatValue = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toFixed(0);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-white">
        {formatValue(value)}
        {suffix}
      </p>
    </div>
  );
}

export default function Home() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // เรียก API จาก Agent ที่รันอยู่ที่ port 3001
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        // Fetch ข้อมูลพร้อมกันทั้งหมด
        const [salesRes, productRes, kpiRes] = await Promise.all([
          fetch(`${apiUrl}/api/data/sales-by-month`),
          fetch(`${apiUrl}/api/data/top-products`),
          fetch(`${apiUrl}/api/data/sales-summary`),
        ]);

        if (!salesRes.ok || !productRes.ok || !kpiRes.ok) {
          throw new Error("Failed to fetch data from one or more endpoints");
        }

        const [salesResult, productResult, kpiResult] = await Promise.all([
          salesRes.json(),
          productRes.json(),
          kpiRes.json(),
        ]);

        // แปลงข้อมูลเพื่อให้แน่ใจว่าเป็น Type ที่ถูกต้อง
        setSalesData(
          salesResult.map((item: any) => ({
            ...item,
            total_sales: Number(item.total_sales),
          }))
        );

        setProductData(
          productResult.map((item: any) => ({
            ...item,
            revenue: Number(item.revenue),
          }))
        );

        // KPI data อาจจะมาเป็น array ตัวเดียว
        const kpi = Array.isArray(kpiResult) ? kpiResult[0] : kpiResult;
        setKpiData({
          total_orders: Number(kpi.total_orders),
          total_revenue: Number(kpi.total_revenue),
          avg_order_value: Number(kpi.avg_order_value),
        });
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="text-center mt-4 text-gray-400">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-bold mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🚀 Flexboard - Analytics Dashboard
        </h1>

        {/* KPI Cards */}
        {kpiData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard title="Total Orders" value={kpiData.total_orders} />
            <KPICard
              title="Total Revenue"
              value={kpiData.total_revenue}
              suffix="$"
            />
            <KPICard
              title="Avg Order Value"
              value={kpiData.avg_order_value}
              suffix="$"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Sales by Month Chart */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Sales by Month</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="total_sales"
                    fill="#3b82f6"
                    name="Total Sales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Top Products by Revenue</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis type="number" stroke="#888" />
                  <YAxis
                    type="category"
                    dataKey="product_name"
                    stroke="#888"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400">
          <p>🏗️ Flexboard MVP - Hybrid Analytics Platform</p>
          <p className="text-sm">
            Data refreshed automatically from On-Premise Agent
          </p>
        </div>
      </div>
    </main>
  );
}
