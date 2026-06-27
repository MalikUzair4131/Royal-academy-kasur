"use client";

import dynamic from 'next/dynamic';

const Reports = dynamic(() => import('@/components/pages/Reports'), { ssr: false });

export default function ReportsClient() {
  return <Reports />;
}
