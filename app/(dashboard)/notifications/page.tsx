"use client";
import { useEffect, useState } from "react";
import { notificationsApi } from "@/services/api";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    notificationsApi.list().then(r => setNotifications(r.data.notifications || [])).catch(() => {});
  }, []);
  return (
    <div>
      <div className="page-header"><h1 className="text-2xl font-bold text-gray-900">Notifications</h1></div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><Bell className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No notifications</p></div>
        ) : notifications.map((n: any) => (
          <div key={n._id} className={"p-4 " + (n.isRead ? "opacity-60" : "bg-blue-50/30")}>
            <p className="font-medium text-gray-800 text-sm">{n.title}</p>
            <p className="text-gray-500 text-xs mt-1">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
