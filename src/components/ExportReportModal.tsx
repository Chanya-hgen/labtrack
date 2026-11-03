import React, { useState } from 'react';
import { LabSettings, MonitoringLogEntry, LabEquipment } from '../types';
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  CheckCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LabSettings;
  onUpdateSettings: (settings: LabSettings) => void;
  logs: MonitoringLogEntry[];
  equipmentList: LabEquipment[];
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => { success: boolean; error?: string; count?: number };
  onResetDefaults: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  logs,
  equipmentList,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'export' | 'print' | 'settings'>('export');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Editable settings
  const [labName, setLabName] = useState(settings.labName);
  const [department, setDepartment] = useState(settings.department);
  const [standardReference, setStandardReference] = useState(settings.standardReference);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      labName,
      department,
      standardReference,
    });
    alert('บันทึกการตั้งค่าหน่วยงานเรียบร้อยแล้ว');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = onImportJSON(content);
      if (res.success) {
        setImportStatus(`นำเข้าข้อมูลสำเร็จ ${res.count} รายการ`);
      } else {
        setImportStatus(`ข้อผิดพลาด: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#35586C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-200" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">รายงานและส่งออกข้อมูล (Reports & Export)</h3>
              <p className="text-xs text-cyan-100">
                ส่งออก Excel/CSV, พิมพ์แบบฟอร์มตรวจสอบประจำวัน และสำรองข้อมูล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'export'
                ? 'border-[#35586C] text-[#35586C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ส่งออกไฟล์ (CSV / JSON)
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'print'
                ? 'border-[#35586C] text-[#35586C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            พิมพ์เอกสารตรวจสอบประจำวัน
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-[#35586C] text-[#35586C]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            หัวกระดาษหน่วยงาน
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Excel / CSV Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    ส่งออกไฟล์ Excel / CSV
                  </div>
                  <p className="text-xs text-slate-500">
                    มี BOM UTF-8 เปิดใน Microsoft Excel ภาษาไทยได้ทันที ไม่เกิดปัญหาตัวอักษรเพี้ยน
                    ประกอบด้วยวัน เวลาละเอียดระดับวินาที ค่า Min-Max และการแก้ไข
                  </p>
                  <div className="text-[11px] text-slate-400">
                    ข้อมูลพร้อมส่งออกทั้งหมด {logs.length} รายการ
                  </div>
                </div>

                <button
                  onClick={() => {
                    onExportCSV();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 active:scale-95 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด CSV</span>
                </button>
              </div>

              {/* JSON Backup & Restore Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                    <FileText className="w-4 h-4 text-[#467189]" />
                    สำรองและกู้คืนฐานข้อมูล (JSON Backup & Restore)
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ย้ายข้อมูลระหว่างมือถือ แท็บเล็ต หรือคอมพิวเตอร์ประจำเคาน์เตอร์แล็บ
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onExportJSON}
                    className="px-3.5 py-2 rounded-xl bg-[#35586C] hover:bg-[#2B4B5D] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ดาวน์โหลด Backup JSON</span>
                  </button>

                  <label className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>นำเข้าไฟล์ Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <div className="text-xs p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-medium">
                    {importStatus}
                  </div>
                )}
              </div>

              {/* Reset to defaults */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>ต้องการเริ่มบันทึกใหม่ หรือรีเซ็ตข้อมูลตัวอย่าง?</span>
                <button
                  onClick={() => {
                    if (confirm('คุณต้องการรีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นโรงพยาบาล/ห้องแล็บตัวอย่างหรือไม่?')) {
                      onResetDefaults();
                      alert('รีเซ็ตข้อมูลเรียบร้อย');
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  รีเซ็ตข้อมูลเริ่มต้น (Sample Reset)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">
                    แบบฟอร์มตรวจสอบอุปกรณ์ประจำวัน (Daily Equipment Logsheet)
                  </h4>
                  <p className="text-xs text-slate-500">
                    จัดรูปแบบพร้อมช่องลงลายมือชื่อผู้ตรวจและผู้รับรอง
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-[#35586C] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#2B4B5D]"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์ / Save as PDF</span>
                </button>
              </div>

              {/* Print Preview Canvas Box */}
              <div className="p-4 rounded-xl border border-slate-300 bg-white shadow-xs font-serif text-[11px] space-y-3">
                <div className="text-center border-b pb-2">
                  <div className="font-bold text-sm uppercase">{settings.labName}</div>
                  <div className="text-xs text-slate-600">{settings.department}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-1">หน่วยงาน</th>
                        <th className="border border-slate-300 p-1">รหัสเครื่อง</th>
                        <th className="border border-slate-300 p-1">ชื่อเครื่อง</th>
                        <th className="border border-slate-300 p-1">จุดตรวจ/พารามิเตอร์</th>
                        <th className="border border-slate-300 p-1">เกณฑ์ปกติ</th>
                        <th className="border border-slate-300 p-1">ค่าล่าสุด</th>
                        <th className="border border-slate-300 p-1">สถานะ</th>
                        <th className="border border-slate-300 p-1">ผู้บันทึก (MT)</th>
                        <th className="border border-slate-300 p-1">ปัญหา / การแก้ไข</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipmentList.map(eq =>
                        eq.parameters.map((param, idx) => {
                          const log = logs.find(
                            l => l.equipmentId === eq.id && l.parameterId === param.id
                          );
                          const deptName = eq.departmentUnit === 'chromosome_analysis'
                            ? 'Chromosome'
                            : eq.departmentUnit === 'reproductive_biology'
                            ? 'Reproductive'
                            : eq.departmentUnit === 'molecular_genetics'
                            ? 'Molecular'
                            : '-';

                          return (
                            <tr key={`${eq.id}_${param.id}`}>
                              {idx === 0 && (
                                <td
                                  rowSpan={eq.parameters.length}
                                  className="border border-slate-300 p-1 font-semibold align-top text-slate-700"
                                >
                                  {deptName}
                                </td>
                              )}
                              {idx === 0 && (
                                <td
                                  rowSpan={eq.parameters.length}
                                  className="border border-slate-300 p-1 font-bold align-top"
                                >
                                  {eq.id}
                                </td>
                              )}
                              {idx === 0 && (
                                <td
                                  rowSpan={eq.parameters.length}
                                  className="border border-slate-300 p-1 align-top"
                                >
                                  {eq.name}
                                </td>
                              )}
                              <td className="border border-slate-300 p-1">{param.name}</td>
                              <td className="border border-slate-300 p-1">
                                {param.min} - {param.max} {param.unit}
                              </td>
                              <td className="border border-slate-300 p-1 font-bold">
                                {log ? (log.isUnreadable || log.value === null ? 'ตัวอ่านชำรุด' : `${log.value} ${param.unit}`) : '-'}
                              </td>
                              <td className="border border-slate-300 p-1">
                                {log?.isUnreadable ? 'DEFECTIVE (ชำรุด)' : log?.isOutOfSpec ? 'OUT OF SPEC' : 'PASS (ปกติ)'}
                              </td>
                              <td className="border border-slate-300 p-1">
                                {log?.inspectorName || '-'}
                              </td>
                              <td className="border border-slate-300 p-1">
                                {log?.problem ? `${log.problem} | แก้ไข: ${log.correctiveAction || '-'}` : '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-8 text-[11px] text-center">
                  <div className="border-t border-slate-400 pt-1">
                    ลงชื่อ........................................................ ผู้ตรวจเช็ก
                    <br />
                    ( {settings.defaultInspector} )
                    <br />
                    ตำแหน่ง: นักเทคนิคการแพทย์ (Medical Technologist)
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    ลงชื่อ........................................................ ผู้ทบทวน / Lab Director
                    <br />
                    (...........................................................)
                    <br />
                    หัวหน้าห้องปฏิบัติการทางการแพทย์
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ชื่อห้องปฏิบัติการ (Laboratory Name)
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  กลุ่มงาน / แผนก (Department)
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  มาตรฐานอ้างอิง (Standard Reference)
                </label>
                <input
                  type="text"
                  value={standardReference}
                  onChange={e => setStandardReference(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="mt-2 py-2 px-4 rounded-xl bg-[#35586C] text-white font-bold text-xs"
              >
                บันทึกการตั้งค่าหัวกระดาษ
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
