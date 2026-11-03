import React, { useState, useMemo } from 'react';
import { useLabData } from './hooks/useLabData';
import { LabEquipment } from './types';
import { DEPARTMENT_UNIT_CONFIG } from './data/defaultEquipment';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { EquipmentCard } from './components/EquipmentCard';
import { InteractiveChart } from './components/InteractiveChart';
import { LogHistoryTable } from './components/LogHistoryTable';
import { QuickLogModal } from './components/QuickLogModal';
import { EquipmentManagerModal } from './components/EquipmentManagerModal';
import { ExportReportModal } from './components/ExportReportModal';
import { InspectorModal } from './components/InspectorModal';
import {
  ClipboardCheck,
  TrendingUp,
  History,
  SlidersHorizontal,
  Plus,
  Flame,
  Gauge,
  Wind,
  Snowflake,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Sparkles,
} from 'lucide-react';

type MainTab = 'inspection' | 'chart' | 'history' | 'equipment';

export default function App() {
  const {
    equipmentList,
    logs,
    settings,
    setSettings,
    addLog,
    deleteLog,
    saveEquipment,
    deleteEquipment,
    resetToDefaults,
    exportToCSV,
    exportToJSON,
    importFromJSON,
  } = useLabData();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<MainTab>('inspection');

  // Category filter for inspection tab
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [quickLogEquipment, setQuickLogEquipment] = useState<LabEquipment | null>(null);
  const [isEquipmentManagerOpen, setIsEquipmentManagerOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<LabEquipment | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);

  // Chart selection synchronization
  const [chartEquipmentId, setChartEquipmentId] = useState<string>(equipmentList[0]?.id || '');

  // Current inspector state
  const [currentInspector, setCurrentInspector] = useState<string>(
    settings.defaultInspector || 'Chanya Pawong MT.19843'
  );

  // Latest log map for each equipment parameter: key = `${equipmentId}_${paramId}`
  const latestLogsMap = useMemo(() => {
    const map: Record<string, (typeof logs)[0]> = {};
    // Logs are sorted newest first in hook
    for (const log of logs) {
      const key = `${log.equipmentId}_${log.parameterId}`;
      if (!map[key]) {
        map[key] = log;
      }
    }
    return map;
  }, [logs]);

  // Today's summary statistics
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.timestamp.startsWith(today));
    const outOfSpecCount = todayLogs.filter(l => l.isOutOfSpec).length;

    // Count how many equipment have had at least one check today
    const checkedEqIds = new Set(todayLogs.map(l => l.equipmentId));
    const checkedCount = checkedEqIds.size;
    const totalEquipment = equipmentList.filter(e => e.active).length;

    return {
      totalLogsToday: todayLogs.length,
      outOfSpecCount,
      checkedCount,
      totalEquipment,
      allDone: totalEquipment > 0 && checkedCount >= totalEquipment,
    };
  }, [logs, equipmentList]);

  // Filtered equipment list for inspection tab (by department unit)
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(eq => {
      if (!eq.active) return false;
      if (selectedCategory === 'all') return true;
      return eq.departmentUnit === selectedCategory || eq.category === selectedCategory;
    });
  }, [equipmentList, selectedCategory]);

  // Handle open chart from an equipment card
  const handleOpenChartForEquipment = (equipmentId: string) => {
    setChartEquipmentId(equipmentId);
    setActiveTab('chart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle edit equipment
  const handleEditEquipment = (equipment: LabEquipment) => {
    setEquipmentToEdit(equipment);
    setIsEquipmentManagerOpen(true);
  };

  const handleAddNewEquipment = () => {
    setEquipmentToEdit(null);
    setIsEquipmentManagerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#1E293B] flex flex-col font-sans">
      {/* Offline PWA Connectivity Indicator */}
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        currentInspector={currentInspector}
        onOpenInspectorModal={() => setIsInspectorModalOpen(true)}
        onOpenAddEquipment={handleAddNewEquipment}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        outOfSpecCountToday={todayStats.outOfSpecCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 sm:pb-12">
        {/* Inspection Header Banner (Summary of daily round) */}
        {activeTab === 'inspection' && (
          <div className="mb-4 sm:mb-6 rounded-2xl bg-gradient-to-r from-[#35586C] via-[#467189] to-[#5A859E] text-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                    Daily Round
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold mt-1">
                  Daily Equipment & Temperature Monitoring Log
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  แตะที่ปุ่ม <strong className="text-cyan-200">"บันทึกจุดตรวจ"</strong> หน้าเครื่องเพื่อเปิดแผงกรอกตัวเลข พร้อมช่องบันทึกปัญหาและการแก้ไข
                </p>
              </div>

              {/* Progress Counters */}
              <div className="flex items-center gap-2 bg-black/15 p-2 rounded-2xl border border-white/10 shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-white/15 text-center">
                  <div className="text-[10px] text-cyan-100">ตรวจแล้ววันนี้</div>
                  <div className="text-sm sm:text-base font-extrabold">
                    {todayStats.checkedCount} / {todayStats.totalEquipment} เครื่อง
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl text-center ${
                    todayStats.outOfSpecCount > 0 ? 'bg-rose-500 text-white font-bold' : 'bg-white/15'
                  }`}
                >
                  <div className="text-[10px] text-cyan-100">หลุดเกณฑ์ (Alert)</div>
                  <div className="text-sm sm:text-base font-extrabold">
                    {todayStats.outOfSpecCount} รายการ
                  </div>
                </div>
              </div>
            </div>

            {/* Department Unit Filter Chips Bar */}
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-cyan-200 shrink-0">
                เลือกหน่วยงาน:
              </span>
              {[
                { id: 'all', label: 'ทั้งหมด (All Units)' },
                { id: 'chromosome_analysis', label: 'Chromosome Analysis' },
                { id: 'reproductive_biology', label: 'Reproductive Biology' },
                { id: 'molecular_genetics', label: 'Molecular Genetics' },
              ].map(unit => {
                const isSelected = selectedCategory === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedCategory(unit.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                      isSelected
                        ? 'bg-white text-[#35586C] shadow-sm'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {unit.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Equipment Walk Inspection Grid */}
        {activeTab === 'inspection' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                แสดง {filteredEquipment.length} เครื่องมือ ({selectedCategory === 'all' ? 'ทุกประเภท' : selectedCategory})
              </span>
              <button
                onClick={handleAddNewEquipment}
                className="font-semibold text-[#35586C] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มเครื่องมือใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredEquipment.map(eq => (
                <EquipmentCard
                  key={eq.id}
                  equipment={eq}
                  latestLogs={latestLogsMap}
                  onOpenQuickLog={equipment => setQuickLogEquipment(equipment)}
                  onOpenChart={handleOpenChartForEquipment}
                  onEditEquipment={handleEditEquipment}
                />
              ))}
            </div>

            {filteredEquipment.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <p className="text-slate-500 font-medium">ไม่พบเครื่องมือในหมวดหมู่นี้</p>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-2 text-xs font-bold text-[#35586C] underline"
                >
                  ดูเครื่องมือทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Real-Time Chart */}
        {activeTab === 'chart' && (
          <div className="space-y-4">
            <InteractiveChart
              equipmentList={equipmentList}
              logs={logs}
              selectedEquipmentId={chartEquipmentId}
              onSelectEquipment={id => setChartEquipmentId(id)}
            />
          </div>
        )}

        {/* Tab 3: History & Audit Log Table */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <LogHistoryTable
              logs={logs}
              onDeleteLog={deleteLog}
              onExportCSV={exportToCSV}
            />
          </div>
        )}

        {/* Tab 4: Equipment & Parameter Range Configuration */}
        {activeTab === 'equipment' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  รายการเครื่องมือและเกณฑ์ควบคุม (Equipment & Specs)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตั้งค่าเกณฑ์ปกติ (Min - Max Acceptable Range) แยกตามแต่ละเครื่อง เพื่อใช้ตรวจสอบสัญญาณเตือนสีแดง
                </p>
              </div>
              <button
                onClick={handleAddNewEquipment}
                className="px-4 py-2 rounded-xl bg-[#35586C] hover:bg-[#2B4B5D] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                เพิ่มเครื่องมือใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {equipmentList.map(eq => (
                <div
                  key={eq.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-[#467189]/10 text-[#35586C]">
                          ครุภัณฑ์: {eq.id}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                          {eq.departmentUnit === 'chromosome_analysis'
                            ? 'Chromosome Analysis'
                            : eq.departmentUnit === 'reproductive_biology'
                            ? 'Reproductive Biology'
                            : eq.departmentUnit === 'molecular_genetics'
                            ? 'Molecular Genetics'
                            : 'Other Unit'}
                        </span>
                        <span className="text-xs text-slate-500">{eq.location}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mt-1">{eq.name}</h4>
                    </div>

                    <button
                      onClick={() => handleEditEquipment(eq)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                    >
                      แก้ไขเกณฑ์
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                    {eq.parameters.map(param => (
                      <div
                        key={param.id}
                        className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80"
                      >
                        <span className="font-medium text-slate-700">{param.name}</span>
                        <div className="text-right">
                          <span className="font-bold text-rose-700">
                            {param.min} - {param.max} {param.unit}
                          </span>
                          {param.target !== undefined && (
                            <span className="text-[11px] text-slate-400 ml-1.5">
                              (Target: {param.target})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) on mobile for Rapid Log Entry */}
      {activeTab === 'inspection' && equipmentList.length > 0 && (
        <button
          onClick={() => setQuickLogEquipment(equipmentList[0])}
          className="sm:hidden fixed bottom-18 right-4 z-40 bg-[#35586C] text-white p-3.5 rounded-full shadow-xl hover:bg-[#2B4B5D] active:scale-95 transition flex items-center justify-center border-2 border-white"
          title="บันทึกจุดตรวจด่วน"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Mobile-First Bottom Navigation Bar (Ergonomic for one-hand operation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1">
          <button
            onClick={() => setActiveTab('inspection')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'inspection'
                ? 'text-[#35586C] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <ClipboardCheck
              className={`w-5 h-5 ${
                activeTab === 'inspection' ? 'stroke-[2.5] text-[#35586C]' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[10px] mt-0.5 tracking-tight">Inspection</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'chart'
                ? 'text-[#35586C] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 ${
                activeTab === 'chart' ? 'stroke-[2.5] text-[#35586C]' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[10px] mt-0.5 tracking-tight">Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'history'
                ? 'text-[#35586C] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <History
              className={`w-5 h-5 ${
                activeTab === 'history' ? 'stroke-[2.5] text-[#35586C]' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[10px] mt-0.5 tracking-tight">History</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'equipment'
                ? 'text-[#35586C] font-extrabold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <SlidersHorizontal
              className={`w-5 h-5 ${
                activeTab === 'equipment' ? 'stroke-[2.5] text-[#35586C]' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
          </button>
        </div>
      </nav>

      {/* Quick Log Modal (Big Touch Numpad & Instant Red Alert) */}
      <QuickLogModal
        isOpen={Boolean(quickLogEquipment)}
        onClose={() => setQuickLogEquipment(null)}
        equipment={quickLogEquipment}
        currentInspector={currentInspector}
        onSaveLog={newLog => {
          addLog(newLog);
          // If out of spec, offer to switch to chart to see the incident
          if (newLog.isOutOfSpec && newLog.equipmentId) {
            setChartEquipmentId(newLog.equipmentId);
          }
        }}
      />

      {/* Equipment Manager Modal (Edit Min-Max range / Add machine) */}
      <EquipmentManagerModal
        isOpen={isEquipmentManagerOpen}
        onClose={() => setIsEquipmentManagerOpen(false)}
        equipmentToEdit={equipmentToEdit}
        onSave={saveEquipment}
        onDelete={deleteEquipment}
      />

      {/* Export & Report Modal (ISO 15189 Excel/CSV / Print sheet / Backup) */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        logs={logs}
        equipmentList={equipmentList}
        onExportCSV={exportToCSV}
        onExportJSON={exportToJSON}
        onImportJSON={importFromJSON}
        onResetDefaults={resetToDefaults}
      />

      {/* Inspector Profile Switcher Modal */}
      <InspectorModal
        isOpen={isInspectorModalOpen}
        onClose={() => setIsInspectorModalOpen(false)}
        currentInspector={currentInspector}
        onSelectInspector={name => {
          setCurrentInspector(name);
          setSettings(prev => ({ ...prev, defaultInspector: name }));
        }}
      />
    </div>
  );
}
