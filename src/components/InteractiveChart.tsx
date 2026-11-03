import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LabEquipment, MonitoringLogEntry } from '../types';
import { Activity, AlertTriangle, CheckCircle2, Calendar, Filter, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InteractiveChartProps {
  equipmentList: LabEquipment[];
  logs: MonitoringLogEntry[];
  selectedEquipmentId?: string;
  onSelectEquipment?: (id: string) => void;
}

type TimeframeFilter = 'today' | '7d' | '30d' | 'all';

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  equipmentList,
  logs,
  selectedEquipmentId,
  onSelectEquipment,
}) => {
  // Department unit filter state
  const [chartUnitFilter, setChartUnitFilter] = useState<string>('all');

  // Filter equipment by unit
  const visibleEquipment = useMemo(() => {
    if (chartUnitFilter === 'all') return equipmentList;
    return equipmentList.filter(eq => eq.departmentUnit === chartUnitFilter);
  }, [equipmentList, chartUnitFilter]);

  // Current equipment selection
  const [activeEquipmentId, setActiveEquipmentId] = useState<string>(
    selectedEquipmentId || equipmentList[0]?.id || ''
  );

  // Synchronize if parent passes prop
  React.useEffect(() => {
    if (selectedEquipmentId && selectedEquipmentId !== activeEquipmentId) {
      setActiveEquipmentId(selectedEquipmentId);
    }
  }, [selectedEquipmentId]);

  const currentEquipment = useMemo(() => {
    const found = equipmentList.find(eq => eq.id === activeEquipmentId);
    if (found) return found;
    return visibleEquipment[0] || equipmentList[0];
  }, [equipmentList, activeEquipmentId, visibleEquipment]);

  // Parameter selection for this equipment
  const [activeParamId, setActiveParamId] = useState<string>(
    currentEquipment?.parameters[0]?.id || ''
  );

  // If current equipment changes, ensure param exists
  React.useEffect(() => {
    if (currentEquipment) {
      const exists = currentEquipment.parameters.some(p => p.id === activeParamId);
      if (!exists && currentEquipment.parameters.length > 0) {
        setActiveParamId(currentEquipment.parameters[0].id);
      }
    }
  }, [currentEquipment, activeParamId]);

  const currentParam = useMemo(() => {
    return currentEquipment?.parameters.find(p => p.id === activeParamId) || currentEquipment?.parameters[0];
  }, [currentEquipment, activeParamId]);

  // Timeframe filter state
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('7d');

  // Filter logs for this equipment and parameter
  const filteredLogs = useMemo(() => {
    if (!currentEquipment || !currentParam) return [];

    const now = new Date().getTime();
    let cutoffTime = 0;

    if (timeframe === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      cutoffTime = startOfDay.getTime();
    } else if (timeframe === '7d') {
      cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe === '30d') {
      cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    const matches = logs.filter(log => {
      if (log.equipmentId !== currentEquipment.id) return false;
      if (log.parameterId !== currentParam.id) return false;
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= cutoffTime;
    });

    // Sort chronologically (oldest to newest) for chart plotting
    return matches.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs, currentEquipment, currentParam, timeframe]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredLogs.length === 0) {
      return {
        count: 0,
        outOfSpecCount: 0,
        outOfSpecRate: 0,
        unreadableCount: 0,
        avg: null,
        min: null,
        max: null,
        latest: null,
      };
    }

    const numericLogs = filteredLogs.filter(l => typeof l.value === 'number' && !isNaN(l.value));
    const values = numericLogs.map(l => l.value as number);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = values.length > 0 ? Number((sum / values.length).toFixed(2)) : null;
    const min = values.length > 0 ? Number(Math.min(...values).toFixed(2)) : null;
    const max = values.length > 0 ? Number(Math.max(...values).toFixed(2)) : null;
    const outOfSpecCount = filteredLogs.filter(l => l.isOutOfSpec).length;
    const unreadableCount = filteredLogs.filter(l => l.isUnreadable).length;
    const outOfSpecRate = (outOfSpecCount / filteredLogs.length) * 100;
    const latest = filteredLogs[filteredLogs.length - 1];

    return {
      count: filteredLogs.length,
      outOfSpecCount,
      outOfSpecRate,
      unreadableCount,
      avg,
      min,
      max,
      latest,
    };
  }, [filteredLogs]);

  // Format labels & datasets for Chart.js
  const chartData = useMemo(() => {
    if (!currentParam || filteredLogs.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = filteredLogs.map(log => {
      const d = new Date(log.timestamp);
      // Format as "02/11 17:47" or "17:47" if today
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      return timeframe === 'today' ? timeStr : `${dateStr} ${timeStr.slice(0, 5)}`;
    });

    const values = filteredLogs.map(log => log.value);
    const pointBackgroundColors = filteredLogs.map(log =>
      log.isOutOfSpec ? '#EF4444' : '#467189'
    );
    const pointBorderColors = filteredLogs.map(log =>
      log.isOutOfSpec ? '#991B1B' : '#FFFFFF'
    );
    const pointRadii = filteredLogs.map(log => (log.isOutOfSpec ? 7 : 5));
    const pointHoverRadii = filteredLogs.map(log => (log.isOutOfSpec ? 9 : 7));

    // Target Range lines (Min line and Max line)
    const minLine = new Array(labels.length).fill(currentParam.min);
    const maxLine = new Array(labels.length).fill(currentParam.max);
    const targetLine = currentParam.target !== undefined ? new Array(labels.length).fill(currentParam.target) : [];

    return {
      labels,
      datasets: [
        {
          label: `${currentParam.name} (${currentParam.unit})`,
          data: values,
          borderColor: '#467189',
          backgroundColor: 'rgba(70, 113, 137, 0.08)',
          borderWidth: 2.5,
          tension: 0.25,
          fill: false,
          pointBackgroundColor: pointBackgroundColors,
          pointBorderColor: pointBorderColors,
          pointBorderWidth: 2,
          pointRadius: pointRadii,
          pointHoverRadius: pointHoverRadii,
          order: 1,
        },
        {
          label: `Max เกณฑ์สูงสุด (${currentParam.max} ${currentParam.unit})`,
          data: maxLine,
          borderColor: 'rgba(239, 68, 68, 0.75)',
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 0,
          fill: false,
          order: 2,
        },
        {
          label: `Min เกณฑ์ต่ำสุด (${currentParam.min} ${currentParam.unit})`,
          data: minLine,
          borderColor: 'rgba(239, 68, 68, 0.75)',
          borderWidth: 1.5,
          borderDash: [5, 4],
          pointRadius: 0,
          fill: false,
          order: 3,
        },
        ...(targetLine.length > 0
          ? [
              {
                label: `Target จุดเป้าหมาย (${currentParam.target} ${currentParam.unit})`,
                data: targetLine,
                borderColor: 'rgba(16, 185, 129, 0.65)',
                borderWidth: 1.5,
                borderDash: [2, 2],
                pointRadius: 0,
                fill: false,
                order: 4,
              },
            ]
          : []),
      ],
    };
  }, [filteredLogs, currentParam, timeframe]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          font: {
            size: 11,
            family: "'Plus Jakarta Sans', 'Sarabun', sans-serif",
          },
          filter: item => item.text?.includes('Max') || item.text?.includes('Min') || item.text?.includes('Target') || false,
        },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleFont: {
          size: 13,
          weight: 'bold',
          family: "'Plus Jakarta Sans', 'Sarabun', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Plus Jakarta Sans', 'Sarabun', sans-serif",
        },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: tooltipItems => {
            const index = tooltipItems[0].dataIndex;
            const log = filteredLogs[index];
            if (!log) return '';
            const dt = new Date(log.timestamp);
            return `📅 ${dt.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })} เวลา ${dt.toLocaleTimeString('th-TH', { hour12: false })}`;
          },
          label: tooltipItem => {
            if (tooltipItem.datasetIndex !== 0) return '';
            const index = tooltipItem.dataIndex;
            const log = filteredLogs[index];
            if (!log) return '';

            const status = log.isUnreadable
              ? '⚠️ ตัวอ่านชำรุด (ไม่สามารถอ่านค่าได้)'
              : log.isOutOfSpec
              ? '🚨 หลุดเกณฑ์ (OUT OF SPEC)'
              : '✅ ปกติ (IN SPEC)';

            const valText = log.isUnreadable || log.value === null
              ? 'ค่าที่วัดได้: [ตัวอ่านชำรุด / ไม่สามารถอ่านค่าได้]'
              : `ค่าที่วัดได้: ${log.value} ${log.unit} [${status}]`;

            const lines = [
              valText,
              `เกณฑ์ยอมรับ: ${log.min} - ${log.max} ${log.unit}`,
              `ผู้บันทึก: ${log.inspectorName}`,
            ];
            if (log.problem) {
              lines.push(`🔴 ปัญหา: ${log.problem}`);
            }
            if (log.correctiveAction) {
              lines.push(`🛠️ การแก้ไข: ${log.correctiveAction}`);
            }
            if (log.notes) {
              lines.push(`📝 หมายเหตุ: ${log.notes}`);
            }
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#F1F5F9',
        },
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: {
          color: '#E2E8F0',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: value => `${value} ${currentParam?.unit || ''}`,
        },
        suggestedMin: currentParam ? currentParam.min - (currentParam.max - currentParam.min) * 0.2 : undefined,
        suggestedMax: currentParam ? currentParam.max + (currentParam.max - currentParam.min) * 0.2 : undefined,
      },
    },
  };

  if (!currentEquipment || !currentParam) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-200">
        ไม่พบข้อมูลเครื่องมือสำหรับการแสดงผลกราฟ
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Header & Selector Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-b from-[#F8FAFC] to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#467189]/10 text-[#467189]">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                กราฟติดตามแบบเรียลไทม์ (Interactive Trend)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงข้อมูลทันทีที่บันทึกจุดใหม่ พร้อมเส้นเกณฑ์มาตรฐาน (Reference Lines)
            </p>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            {(
              [
                { id: 'today', label: 'วันนี้' },
                { id: '7d', label: '7 วัน' },
                { id: '30d', label: '30 วัน' },
                { id: 'all', label: 'ทั้งหมด' },
              ] as const
            ).map(t => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === t.id
                    ? 'bg-white text-[#35586C] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Department Unit Selector Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">หน่วยงาน:</span>
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'chromosome_analysis', label: 'Chromosome Analysis' },
            { id: 'reproductive_biology', label: 'Reproductive Biology' },
            { id: 'molecular_genetics', label: 'Molecular Genetics' },
          ].map(unit => {
            const isSelected = chartUnitFilter === unit.id;
            return (
              <button
                key={unit.id}
                onClick={() => {
                  setChartUnitFilter(unit.id);
                  if (unit.id !== 'all') {
                    const firstInUnit = equipmentList.find(e => e.departmentUnit === unit.id);
                    if (firstInUnit) {
                      setActiveEquipmentId(firstInUnit.id);
                      if (onSelectEquipment) onSelectEquipment(firstInUnit.id);
                    }
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#35586C] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {unit.label}
              </button>
            );
          })}
        </div>

        {/* Equipment Scrollable Chips */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {visibleEquipment.map(eq => {
            const isSelected = eq.id === currentEquipment.id;
            return (
              <button
                key={eq.id}
                onClick={() => {
                  setActiveEquipmentId(eq.id);
                  if (onSelectEquipment) onSelectEquipment(eq.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-[#467189] text-white border-[#467189] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-semibold">{eq.id}:</span> {eq.name}
              </button>
            );
          })}
        </div>

        {/* Parameter Tabs (if equipment has multiple parameters like CO2 + Temp) */}
        {currentEquipment.parameters.length > 1 && (
          <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              พารามิเตอร์:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {currentEquipment.parameters.map(param => (
                <button
                  key={param.id}
                  onClick={() => setActiveParamId(param.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                    param.id === currentParam.id
                      ? 'bg-[#467189]/15 text-[#2B4B5D] font-bold border border-[#467189]/30'
                      : 'text-slate-500 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {param.name} ({param.unit})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Target Range Reference Card & KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-50/70 border-b border-slate-100 text-xs">
        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
          <div className="text-[11px] text-slate-500">เกณฑ์มาตรฐาน (Spec)</div>
          <div className="font-bold text-slate-800 text-sm mt-0.5">
            {currentParam.min} - {currentParam.max} <span className="text-xs font-normal text-slate-500">{currentParam.unit}</span>
          </div>
          {currentParam.target !== undefined && (
            <div className="text-[10px] text-emerald-600 mt-0.5">
              เป้าหมาย (Target): {currentParam.target} {currentParam.unit}
            </div>
          )}
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
          <div className="text-[11px] text-slate-500">ค่าล่าสุด (Latest)</div>
          <div className="font-bold text-sm mt-0.5 flex items-center gap-1.5">
            {stats.latest ? (
              <>
                <span className={stats.latest.isOutOfSpec ? 'text-rose-600 font-extrabold' : 'text-[#35586C]'}>
                  {stats.latest.value} {currentParam.unit}
                </span>
                {stats.latest.isOutOfSpec ? (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-medium">
                    หลุดเกณฑ์
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-700 font-medium">
                    ปกติ
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400 font-normal">ยังไม่มีบันทึก</span>
            )}
          </div>
          {stats.latest && (
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {new Date(stats.latest.timestamp).toLocaleTimeString('th-TH', { hour12: false })} โดย {stats.latest.inspectorName.split(' ')[0]}
            </div>
          )}
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
          <div className="text-[11px] text-slate-500">ค่าเฉลี่ย / Min / Max</div>
          <div className="font-bold text-slate-800 text-sm mt-0.5">
            {stats.avg !== null ? `${stats.avg} ${currentParam.unit}` : '-'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Min: {stats.min ?? '-'} | Max: {stats.max ?? '-'}
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
          <div className="text-[11px] text-slate-500">อัตราความสอดคล้อง</div>
          <div className="font-bold text-sm mt-0.5 flex items-center gap-1">
            {stats.outOfSpecCount > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                พบหลุดเกณฑ์ {stats.outOfSpecCount} ครั้ง ({stats.outOfSpecRate.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ปกติ 100% (In-Spec)
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            รวมบันทึกทั้งหมด {stats.count} ครั้ง
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-3 sm:p-5">
        {filteredLogs.length > 0 ? (
          <div className="h-64 sm:h-80 w-full relative">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl my-4">
            <Activity className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-600">ไม่มีข้อมูลบันทึกในช่วงเวลานี้</p>
            <p className="text-xs text-slate-400 mt-0.5">แตะที่เครื่องมือเพื่อบันทึกจุดข้อมูลใหม่</p>
          </div>
        )}

        {/* Legend Hint for Mobile Users */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#467189]" /> จุดบันทึกปกติ (In-Spec)
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" /> หลุดเกณฑ์ (Out of Spec)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0 border-b-2 border-dashed border-rose-400" /> เส้นเกณฑ์ Min-Max
            </span>
          </div>
          <div className="text-slate-400">
            แตะที่จุดกราฟเพื่อดูเวลาละเอียดระดับวินาที
          </div>
        </div>
      </div>
    </div>
  );
};
