import React from 'react';
import { LabEquipment, MonitoringLogEntry } from '../types';
import { DEPARTMENT_UNIT_CONFIG } from '../data/defaultEquipment';
import {
  Thermometer,
  Dna,
  Sparkles,
  Microscope,
  Sliders,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  Clock,
  Wrench,
} from 'lucide-react';

interface EquipmentCardProps {
  equipment: LabEquipment;
  latestLogs: Record<string, MonitoringLogEntry>; // key: `${equipmentId}_${paramId}`
  onOpenQuickLog: (equipment: LabEquipment) => void;
  onOpenChart: (equipmentId: string) => void;
  onEditEquipment: (equipment: LabEquipment) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  latestLogs,
  onOpenQuickLog,
  onOpenChart,
  onEditEquipment,
}) => {
  const deptInfo = DEPARTMENT_UNIT_CONFIG[equipment.departmentUnit];

  // Unit icon helper
  const getUnitIcon = () => {
    switch (equipment.departmentUnit) {
      case 'chromosome_analysis':
        return <Dna className="w-4 h-4 text-blue-600" />;
      case 'reproductive_biology':
        return <Sparkles className="w-4 h-4 text-teal-600" />;
      case 'molecular_genetics':
        return <Microscope className="w-4 h-4 text-indigo-600" />;
      default:
        return <Thermometer className="w-4 h-4 text-[#467189]" />;
    }
  };

  // Check if any parameter is currently out of spec in its latest log
  const hasOutOfSpec = equipment.parameters.some(param => {
    const key = `${equipment.id}_${param.id}`;
    const log = latestLogs[key];
    return log?.isOutOfSpec;
  });

  // Check if any parameter has a reported problem
  const hasProblem = equipment.parameters.some(param => {
    const key = `${equipment.id}_${param.id}`;
    const log = latestLogs[key];
    return log?.hasProblem;
  });

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-xs hover:shadow-md ${
        hasOutOfSpec
          ? 'border-rose-300 ring-2 ring-rose-400/30'
          : hasProblem
          ? 'border-amber-300 ring-1 ring-amber-400/30'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Top Banner */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-start justify-between gap-2 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0 mt-0.5">
            {getUnitIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#467189]/10 text-[#35586C]">
                {equipment.id}
              </span>
              {deptInfo && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${deptInfo.badgeClass}`}
                >
                  {deptInfo.label}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base mt-1 line-clamp-1">
              {equipment.name}
            </h3>
            <p className="text-[11px] text-slate-400">{equipment.location}</p>
          </div>
        </div>

        {/* Edit Equipment & Range Settings Button */}
        <button
          onClick={() => onEditEquipment(equipment)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="แก้ไขเกณฑ์มาตรฐาน Min - Max"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Parameters List */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        {equipment.parameters.map(param => {
          const key = `${equipment.id}_${param.id}`;
          const latestLog = latestLogs[key];
          const isOut = latestLog?.isOutOfSpec;

          return (
            <div
              key={param.id}
              className={`p-2.5 rounded-xl border text-xs transition-colors ${
                isOut
                  ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                  : 'bg-slate-50/70 border-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{param.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  เกณฑ์: {param.min} - {param.max} {param.unit}
                </span>
              </div>

              {/* Latest Value Row */}
              <div className="mt-1.5 flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">ล่าสุด:</span>
                  {latestLog ? (
                    latestLog.isUnreadable || latestLog.value === null ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ตัวอ่านเสีย/อ่านค่าไม่ได้
                      </span>
                    ) : (
                      <span
                        className={`text-base font-extrabold ${
                          isOut ? 'text-rose-600' : 'text-[#35586C]'
                        }`}
                      >
                        {latestLog.value} <span className="text-xs font-normal">{param.unit}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 italic text-xs">ยังไม่มีบันทึก</span>
                  )}
                </div>

                {latestLog && (
                  <div className="flex items-center gap-1">
                    {latestLog.isUnreadable ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                        <AlertTriangle className="w-3 h-3" />
                        ตัวอ่านชำรุด
                      </span>
                    ) : isOut ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                        <AlertTriangle className="w-3 h-3" />
                        หลุดเกณฑ์
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ปกติ
                      </span>
                    )}

                    {latestLog.hasProblem && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800" title={latestLog.problem}>
                        <Wrench className="w-3 h-3 text-amber-600" />
                        มีบันทึกปัญหา
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Problem / Corrective Action preview if exists */}
              {latestLog?.hasProblem && latestLog.problem && (
                <div className="mt-1.5 p-1.5 bg-amber-50 rounded-lg border border-amber-200/80 text-[11px] text-amber-900">
                  <span className="font-bold">ปัญหา:</span> {latestLog.problem}
                  {latestLog.correctiveAction && (
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      <span className="font-semibold">การแก้ไข:</span> {latestLog.correctiveAction}
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp of last check */}
              {latestLog && (
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    {new Date(latestLog.timestamp).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    {new Date(latestLog.timestamp).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}
                  </span>
                  <span className="truncate max-w-[120px] font-medium text-slate-700">
                    {latestLog.inspectorName.split(' ')[0]}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Card Action Buttons */}
      <div className="p-3 sm:p-4 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenChart(equipment.id)}
          className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition shadow-2xs"
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#467189]" />
          <span>ดูกราฟ Trend</span>
        </button>

        <button
          onClick={() => onOpenQuickLog(equipment)}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 active:scale-98 transition shadow-xs ${
            hasOutOfSpec
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-[#35586C] hover:bg-[#2B4B5D]'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>บันทึกจุดตรวจ</span>
        </button>
      </div>
    </div>
  );
};
