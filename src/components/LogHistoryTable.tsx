import React, { useState, useMemo } from 'react';
import { MonitoringLogEntry, LabDepartmentUnit } from '../types';
import { DEPARTMENT_UNIT_CONFIG } from '../data/defaultEquipment';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Clock,
  User,
  FileSpreadsheet,
  Wrench,
  Filter,
} from 'lucide-react';

interface LogHistoryTableProps {
  logs: MonitoringLogEntry[];
  onDeleteLog: (id: string) => void;
  onExportCSV: () => void;
}

export const LogHistoryTable: React.FC<LogHistoryTableProps> = ({
  logs,
  onDeleteLog,
  onExportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'out_of_spec' | 'problem_only' | 'in_spec'>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search
      const searchMatch =
        !searchTerm.trim() ||
        log.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.parameterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.problem && log.problem.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.correctiveAction && log.correctiveAction.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!searchMatch) return false;

      // Status filter
      if (statusFilter === 'out_of_spec' && !log.isOutOfSpec) return false;
      if (statusFilter === 'problem_only' && !log.hasProblem && !log.isOutOfSpec) return false;
      if (statusFilter === 'in_spec' && log.isOutOfSpec) return false;

      // Department Unit filter
      if (unitFilter !== 'all' && log.departmentUnit !== unitFilter) return false;

      return true;
    });
  }, [logs, searchTerm, statusFilter, unitFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-gradient-to-b from-[#F8FAFC] to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              ประวัติการบันทึกอุณหภูมิ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกการตรวจสอบย้อนหลังทุกจุดตรวจ พร้อมผู้บันทึก และบันทึกปัญหา/การแก้ไข
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาเครื่อง, MT, ปัญหา, การแก้ไข..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-1 focus:ring-[#35586C]"
            />
          </div>

          {/* Unit Filter */}
          <div>
            <select
              value={unitFilter}
              onChange={e => {
                setUnitFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#35586C]"
            >
              <option value="all">ทุกหน่วยงาน (All Units)</option>
              <option value="chromosome_analysis">Chromosome Analysis</option>
              <option value="reproductive_biology">Reproductive Biology</option>
              <option value="molecular_genetics">Molecular Genetics</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ทั้งหมด ({logs.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('out_of_spec');
                setPage(1);
              }}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                statusFilter === 'out_of_spec'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              หลุดเกณฑ์ ({logs.filter(l => l.isOutOfSpec).length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('problem_only');
                setPage(1);
              }}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                statusFilter === 'problem_only'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Wrench className="w-3 h-3" />
              มีปัญหา ({logs.filter(l => l.hasProblem).length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3">วัน-เวลา (Timestamp)</th>
              <th className="py-3 px-3">หน่วยงาน</th>
              <th className="py-3 px-3">เครื่องมือ (Equipment)</th>
              <th className="py-3 px-3">พารามิเตอร์</th>
              <th className="py-3 px-3 text-right">ค่าที่วัดได้</th>
              <th className="py-3 px-3">เกณฑ์ยอมรับ</th>
              <th className="py-3 px-3 text-center">สถานะ</th>
              <th className="py-3 px-3">ผู้บันทึก (MT)</th>
              <th className="py-3 px-3 min-w-[220px]">ปัญหา / การแก้ไข / หมายเหตุ</th>
              <th className="py-3 px-2 text-center">ลบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map(log => {
                const dt = new Date(log.timestamp);
                const isOut = log.isOutOfSpec;
                const dept = log.departmentUnit ? DEPARTMENT_UNIT_CONFIG[log.departmentUnit] : null;

                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isOut ? 'bg-rose-50/40' : log.hasProblem ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {dt.toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {dt.toLocaleTimeString('th-TH', { hour12: false })}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {dept ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${dept.badgeClass}`}>
                          {dept.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Equipment */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#35586C] text-xs">{log.equipmentId}</div>
                      <div className="text-[11px] text-slate-700 font-medium truncate max-w-[150px]">
                        {log.equipmentName}
                      </div>
                    </td>

                    {/* Parameter */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{log.parameterName}</div>
                      <div className="text-[10px] text-slate-400">หน่วย: {log.unit}</div>
                    </td>

                    {/* Measured Value */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {log.isUnreadable || log.value === null ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          ตัวอ่านเสีย / อ่านค่าไม่ได้
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-sm font-extrabold ${
                              isOut ? 'text-rose-600 font-black' : 'text-slate-900'
                            }`}
                          >
                            {log.value}
                          </span>{' '}
                          <span className="text-[11px] text-slate-500">{log.unit}</span>
                        </>
                      )}
                    </td>

                    {/* Spec Range */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {log.min} - {log.max} {log.unit}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {log.isUnreadable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                          <AlertTriangle className="w-3 h-3" />
                          ตัวอ่านชำรุด
                        </span>
                      ) : isOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                          <AlertTriangle className="w-3 h-3" />
                          หลุดเกณฑ์
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ปกติ
                        </span>
                      )}
                    </td>

                    {/* Inspector MT */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{log.inspectorName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.shift === 'morning' ? 'เวรเช้า' : 'เวรบ่าย'}
                      </div>
                    </td>

                    {/* USER REQUIREMENT: ช่องแสดง ปัญหา, การแก้ไข, หมายเหตุ */}
                    <td className="py-3 px-3">
                      {log.hasProblem || log.problem || log.correctiveAction || log.notes ? (
                        <div className="space-y-1 bg-amber-50/70 p-2 rounded-xl border border-amber-200/80 text-[11px]">
                          {log.problem && (
                            <div className="text-rose-900">
                              <span className="font-bold text-rose-700">🔴 ปัญหา:</span> {log.problem}
                            </div>
                          )}
                          {log.correctiveAction && (
                            <div className="text-slate-800">
                              <span className="font-bold text-teal-700">🛠️ การแก้ไข:</span> {log.correctiveAction}
                            </div>
                          )}
                          {log.notes && (
                            <div className="text-slate-600 text-[10px]">
                              <span className="font-bold text-slate-500">📝 หมายเหตุ:</span> {log.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">- ไม่มีปัญหา -</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => {
                          if (confirm('คุณต้องการลบรายการบันทึกนี้หรือไม่?')) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  ไม่พบข้อมูลบันทึกที่ตรงตามเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            แสดง {Math.min(filteredLogs.length, (page - 1) * pageSize + 1)} -{' '}
            {Math.min(filteredLogs.length, page * pageSize)} จากทั้งหมด {filteredLogs.length} รายการ
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
            >
              ก่อนหน้า
            </button>
            <span className="px-2 font-bold text-slate-700">
              หน้า {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
