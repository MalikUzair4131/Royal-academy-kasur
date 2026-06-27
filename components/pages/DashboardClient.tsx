"use client";

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/components/pages/Dashboard'), { ssr: false });

export default function DashboardClient() {
  return <Dashboard />;
}
