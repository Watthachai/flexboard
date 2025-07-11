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

export default function Home() {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // เรียก API จาก Agent ที่รันอยู่ที่ port 3001
        // widgetId คือ 'sales-by-month' ตรงกับที่เราตั้งใน config.json
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/api/data/sales-by-month`);

        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }

        const result = await res.json();

        // แปลงข้อมูลเพื่อให้แน่ใจว่าเป็น Type ที่ถูกต้อง
        const formattedData = result.map((item: any) => ({
          ...item,
          total_sales: Number(item.total_sales),
        }));

        setData(formattedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading Dashboard...</p>;
  if (error)
    return <p className="text-center mt-10 text-red-500">Error: {error}</p>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-2xl font-bold mb-8">Flexboard - Sales Dashboard</h1>
      <div className="w-full h-[500px] bg-gray-800 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#222",
                border: "1px solid #444",
              }}
            />
            <Legend />
            <Bar dataKey="total_sales" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
