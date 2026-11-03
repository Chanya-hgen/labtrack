import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-600 px-3.5 py-1 text-xs font-medium text-white shadow-lg animate-bounce">
        <WifiOff className="w-3.5 h-3.5" />
        <span>โหมดออฟไลน์ — บันทึกข้อมูลลงเครื่อง LocalStorage อัตโนมัติ</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-medium text-white shadow-lg transition-opacity duration-300">
        <Wifi className="w-3.5 h-3.5" />
        <span>เชื่อมต่ออินเทอร์เน็ตแล้ว ข้อมูลพร้อมใช้งาน</span>
      </div>
    );
  }

  return null;
};
