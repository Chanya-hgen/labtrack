import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Thermometer,
  User,
  Clock,
  ShieldCheck,
  Plus,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  currentInspector: string;
  onOpenInspectorModal: () => void;
  onOpenAddEquipment: () => void;
  onOpenExportModal: () => void;
  outOfSpecCountToday: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentInspector,
  onOpenInspectorModal,
  onOpenAddEquipment,
  onOpenExportModal,
  outOfSpecCountToday,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#35586C]/95 backdrop-blur-md text-white border-b border-[#284453] shadow-md pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
          {/* Brand & Title: "Daily Equipment Tracker" */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Thermometer className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                  Daily Equipment Tracker
                </h1>
              </div>
              <p className="text-[10px] sm:text-xs text-cyan-100/90 truncate max-w-[180px] xs:max-w-xs sm:max-w-md md:max-w-xl" title="Division of Human Genetics, Department of Clinical Pathology and Medical Technology, Rajavithi Hospital">
                Division of Human Genetics, Department of Clinical Pathology and Medical Technology, Rajavithi Hospital
              </p>
            </div>
          </div>

          {/* Right Action Icons & Inspector Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Time Ticker */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-cyan-100 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
              <Clock className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-mono font-bold">
                {currentTime.toLocaleTimeString('th-TH', { hour12: false })}
              </span>
            </div>

            {/* Out of spec alert indicator if any today */}
            {outOfSpecCountToday > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-500/90 text-white text-xs font-bold animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">หลุดเกณฑ์</span>
                <span>{outOfSpecCountToday}</span>
              </div>
            )}

            {/* Inspector Selector Chip */}
            <button
              onClick={onOpenInspectorModal}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs transition"
              title="เปลี่ยนชื่อผู้บันทึก (Medical Technologist)"
            >
              <User className="w-3.5 h-3.5 text-cyan-200" />
              <span className="max-w-[100px] sm:max-w-[150px] truncate font-medium text-white">
                {currentInspector.split(' ')[0]}
              </span>
            </button>

            {/* Add Equipment Quick Button */}
            <button
              onClick={onOpenAddEquipment}
              className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs text-white transition font-medium"
              title="เพิ่มเครื่องมือใหม่"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-200" />
              <span>เพิ่มเครื่อง</span>
            </button>

            {/* Export / Report Quick Button */}
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 px-2.5 py-1.5 rounded-xl text-xs text-white transition font-bold shadow-xs"
              title="รายงานและส่งออกข้อมูล Excel / PDF"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">รายงาน/Export</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton compact />
          </div>
        </div>
      </div>
    </header>
  );
};
