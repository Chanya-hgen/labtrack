import React, { useState, useEffect } from 'react';
import { LabEquipment, EquipmentParameter, MonitoringLogEntry, ShiftType } from '../types';
import { LAB_INSPECTORS, DEPARTMENT_UNIT_CONFIG } from '../data/defaultEquipment';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  ChevronDown,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckSquare,
  Square,
  Wrench,
} from 'lucide-react';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: LabEquipment | null;
  currentInspector: string;
  onSaveLog: (entry: Omit<MonitoringLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) => void;
}

const COMMON_PROBLEMS = [
  'อุณหภูมิเกินเกณฑ์กำหนด',
  'แรงดันถังก๊าซต่ำกว่าเกณฑ์',
  'ระดับ VOC สูงผิดปกติ',
  'ประตูปิดไม่สนิท / ขอบยางหลวม',
  'มีเสียงเตือน Alarm หน้าเครื่อง',
  'น้ำแข็งเกาะหนาเกินปกติ',
];

const COMMON_CORRECTIVE_ACTIONS = [
  'ปรับเทอร์โมสตัท / ปรับค่าควบคุมและตรวจซ้ำใน 30 นาที',
  'สลับใช้วาล์วถังแก๊สสำรอง Manifold B ทันที',
  'ตรวจสอบซีลยางและปิดประตูตู้ให้สนิท',
  'ย้ายตัวอย่าง/น้ำยาไปยังตู้สำรองฉุกเฉินและแจ้ง Biomed',
  'เปิดระบบระบายอากาศเสริมและตรวจหารอยรั่ว',
  'รายงานหัวหน้าห้องปฏิบัติการเพื่อบันทึก CAR',
];

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  equipment,
  currentInspector,
  onSaveLog,
}) => {
  if (!isOpen || !equipment) return null;

  // Selected parameter of the equipment
  const [selectedParamId, setSelectedParamId] = useState<string>(
    equipment.parameters[0]?.id || ''
  );

  const currentParam: EquipmentParameter =
    equipment.parameters.find(p => p.id === selectedParamId) || equipment.parameters[0];

  // Current input string value
  const [valueStr, setValueStr] = useState<string>('');
  const [inspector, setInspector] = useState<string>(currentInspector);
  const [shift, setShift] = useState<ShiftType>('morning');

  // Checkbox for sensor/reader broken or unreadable
  const [isUnreadable, setIsUnreadable] = useState<boolean>(false);

  // Toggle for recording problem / issues
  const [hasProblemRecord, setHasProblemRecord] = useState<boolean>(false);
  const [problem, setProblem] = useState<string>('');
  const [correctiveAction, setCorrectiveAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [currentLiveTime, setCurrentLiveTime] = useState<Date>(new Date());

  // Live second-by-second clock for display
  useEffect(() => {
    const timer = setInterval(() => setCurrentLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update inspector when parent prop changes
  useEffect(() => {
    if (currentInspector) {
      setInspector(currentInspector);
    }
  }, [currentInspector]);

  // Set initial default value to target or midpoint when modal opens or parameter changes
  useEffect(() => {
    if (currentParam) {
      const initialVal =
        currentParam.target !== undefined
          ? currentParam.target
          : (currentParam.min + currentParam.max) / 2;
      setValueStr(String(initialVal));
      setIsUnreadable(false);
      setHasProblemRecord(false);
      setProblem('');
      setCorrectiveAction('');
      setNotes('');
    }
  }, [currentParam, equipment]);

  // Determine current numeric value
  const numValue = parseFloat(valueStr);
  const isValidNumber = !isNaN(numValue) && valueStr.trim() !== '';

  // Out of spec detection (IMMEDIATE RED ALERT)
  const isOutOfSpec = isValidNumber && (numValue < currentParam.min || numValue > currentParam.max);
  const isBelowMin = isValidNumber && numValue < currentParam.min;
  const isAboveMax = isValidNumber && numValue > currentParam.max;

  // If out-of-spec occurs, automatically open the problem section
  useEffect(() => {
    if (isOutOfSpec && !hasProblemRecord) {
      setHasProblemRecord(true);
      if (!problem) {
        setProblem(
          isBelowMin
            ? `ค่าต่ำกว่าเกณฑ์ (${numValue} ${currentParam.unit} < ${currentParam.min} ${currentParam.unit})`
            : `ค่าสูงกว่าเกณฑ์ (${numValue} ${currentParam.unit} > ${currentParam.max} ${currentParam.unit})`
        );
      }
    }
  }, [isOutOfSpec, isBelowMin, isAboveMax, numValue, currentParam]);

  // Stepper adjustments
  const adjustValue = (delta: number) => {
    const curr = isValidNumber ? numValue : (currentParam.target ?? currentParam.min);
    const stepDecimals = currentParam.step && currentParam.step < 1 ? 1 : 0;
    const newVal = Number((curr + delta).toFixed(stepDecimals + 1));
    setValueStr(String(newVal));
  };

  // Numpad key input
  const handleKeypadPress = (key: string) => {
    if (key === 'CLEAR') {
      setValueStr('');
      return;
    }
    if (key === 'BACK') {
      setValueStr(prev => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (valueStr.includes('.')) return;
      setValueStr(prev => (prev === '' ? '0.' : prev + '.'));
      return;
    }
    if (key === '+/-') {
      if (valueStr.startsWith('-')) {
        setValueStr(valueStr.slice(1));
      } else {
        setValueStr('-' + valueStr);
      }
      return;
    }
    setValueStr(prev => prev + key);
  };

  const handleSave = () => {
    if (!isUnreadable && !isValidNumber) {
      alert('กรุณาระบุค่าตัวเลขที่วัดได้ให้ถูกต้อง หรือเลือกตัวอ่านเสีย/อ่านค่าไม่ได้');
      return;
    }

    if (isUnreadable) {
      onSaveLog({
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        departmentUnit: equipment.departmentUnit,
        parameterId: currentParam.id,
        parameterName: currentParam.name,
        unit: currentParam.unit,
        value: null,
        min: currentParam.min,
        max: currentParam.max,
        isOutOfSpec: true,
        isUnreadable: true,
        inspectorName: inspector,
        inspectorRole: 'นักเทคนิคการแพทย์ (MT)',
        shift,
        hasProblem: true,
        problem: problem.trim() || `ตัวอ่านเสีย / ไม่สามารถอ่านค่าได้ (${currentParam.name})`,
        correctiveAction: correctiveAction.trim() || 'ติดป้ายแจ้งซ่อมและประสานงานฝ่ายซ่อมบำรุง',
        notes: notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      });
      onClose();
      return;
    }

    if (isOutOfSpec && hasProblemRecord && !correctiveAction.trim()) {
      const proceed = confirm(
        '⚠️ ค่าที่วัดได้หลุดเกณฑ์มาตรฐาน แนะนำให้ระบุการแก้ไข (Corrective Action)\n\nคุณต้องการบันทึกต่อไปหรือไม่?'
      );
      if (!proceed) return;
    }

    // Trigger subtle haptic buzz if supported on mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(isOutOfSpec ? [100, 50, 100] : 40);
      } catch (e) {
        // ignore
      }
    }

    onSaveLog({
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      departmentUnit: equipment.departmentUnit,
      parameterId: currentParam.id,
      parameterName: currentParam.name,
      unit: currentParam.unit,
      value: numValue,
      min: currentParam.min,
      max: currentParam.max,
      isOutOfSpec,
      isUnreadable: false,
      inspectorName: inspector,
      inspectorRole: 'นักเทคนิคการแพทย์ (MT)',
      shift,
      hasProblem: hasProblemRecord || isOutOfSpec,
      problem: hasProblemRecord ? problem.trim() || undefined : undefined,
      correctiveAction: hasProblemRecord ? correctiveAction.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
    });

    onClose();
  };

  const deptInfo = DEPARTMENT_UNIT_CONFIG[equipment.departmentUnit];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] transition-colors duration-300 ${
          isOutOfSpec ? 'ring-2 ring-rose-500' : ''
        }`}
      >
        {/* Header Bar */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between transition-colors duration-300 ${
            isOutOfSpec
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white'
              : 'bg-gradient-to-r from-[#35586C] to-[#467189] text-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-bold uppercase tracking-wider">
                {equipment.id}
              </span>
              {deptInfo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/15 text-cyan-100">
                  {deptInfo.label}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold mt-1 text-white truncate max-w-xs sm:max-w-md">
              {equipment.name}
            </h3>
            <p className="text-[11px] text-white/80">{equipment.location}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Automatic Timestamp Strip */}
        <div className="bg-slate-100/90 px-4 py-2 flex items-center justify-between text-xs border-b border-slate-200 text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#467189]" />
            <span>
              Timestamp อัตโนมัติ:{' '}
              <strong className="text-slate-800">
                {currentLiveTime.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                {currentLiveTime.toLocaleTimeString('th-TH', { hour12: false })}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShift('morning')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                shift === 'morning' ? 'bg-[#35586C] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              รอบเช้า
            </button>
            <button
              onClick={() => setShift('afternoon')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                shift === 'afternoon' ? 'bg-[#35586C] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              รอบบ่าย
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Parameter Selector Pills (if machine has > 1 parameter) */}
          {equipment.parameters.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                เลือกพารามิเตอร์ที่ตรวจวัด:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {equipment.parameters.map(param => (
                  <button
                    key={param.id}
                    onClick={() => setSelectedParamId(param.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      param.id === currentParam.id
                        ? 'bg-[#467189]/10 border-[#467189] text-[#243C4B] font-bold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="text-xs font-semibold">{param.name}</div>
                    <div className="text-[11px] text-slate-500">
                      เกณฑ์: {param.min} - {param.max} {param.unit}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acceptable Spec Box */}
          <div
            className={`p-3 rounded-2xl flex items-center justify-between text-xs transition-colors ${
              isOutOfSpec
                ? 'bg-rose-50 border border-rose-200 text-rose-900'
                : 'bg-sky-50/70 border border-sky-100 text-[#2B4B5D]'
            }`}
          >
            <div>
              <div className="font-semibold flex items-center gap-1.5">
                <span>เกณฑ์มาตรฐานที่ยอมรับได้ (Acceptable Range):</span>
              </div>
              <div className="text-sm font-extrabold mt-0.5">
                {currentParam.min} ถึง {currentParam.max} {currentParam.unit}
              </div>
            </div>
            {currentParam.target !== undefined && (
              <div className="text-right">
                <div className="text-[11px] text-slate-500">เป้าหมาย (Target)</div>
                <div className="font-bold text-slate-800 text-sm">
                  {currentParam.target} {currentParam.unit}
                </div>
              </div>
            )}
          </div>

          {/* USER REQUIREMENT: ติ๊กกรณีตัวอ่านเสียหรือไม่สามารถอ่านค่าได้ */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => {
                const next = !isUnreadable;
                setIsUnreadable(next);
                if (next) {
                  setHasProblemRecord(true);
                  if (!problem) {
                    setProblem(`ตัวอ่านเสีย / ไม่สามารถอ่านค่าได้ (${currentParam.name})`);
                  }
                  if (!correctiveAction) {
                    setCorrectiveAction('ติดป้ายแจ้งซ่อม / ประสานงานฝ่ายซ่อมบำรุง');
                  }
                }
              }}
              className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                isUnreadable
                  ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isUnreadable ? (
                  <CheckSquare className="w-5 h-5 text-amber-700 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 text-slate-800">
                    <AlertTriangle className={`w-3.5 h-3.5 ${isUnreadable ? 'text-amber-700' : 'text-slate-400'}`} />
                    <span>ตัวอ่านเสีย / ไม่สามารถอ่านค่าได้</span>
                  </div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                    ติ๊กช่องนี้หากหัววัดชำรุด, หน้าจอเสีย, หรือไม่แสดงผลตัวเลข
                  </div>
                </div>
              </div>
              {isUnreadable && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold shrink-0">
                  ระบุชำรุด
                </span>
              )}
            </button>
          </div>

          {/* LARGE INPUT DISPLAY & OUT-OF-SPEC ALERT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>ค่าที่อ่านได้จากหน้าเครื่อง ({currentParam.name}):</span>
              {isUnreadable ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ตัวอ่านชำรุด (ไม่สามารถอ่านค่าได้)
                </span>
              ) : isValidNumber ? (
                <span className="font-bold">
                  {isOutOfSpec ? (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      หลุดเกณฑ์มาตรฐาน!
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      อยู่ในเกณฑ์ปกติ
                    </span>
                  )}
                </span>
              ) : null}
            </div>

            {/* Huge numeric input screen or Unreadable Banner */}
            {isUnreadable ? (
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-amber-50/90 text-center space-y-1 animate-fade-in shadow-inner">
                <div className="text-amber-900 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>⚠️ ตัวอ่านชำรุด / ไม่สามารถอ่านค่าได้</span>
                </div>
                <div className="text-xs text-amber-800">
                  ระบบจะบันทึกสถานะชำรุด และส่งต่อข้อมูลไปยังประวัติและรายงานอัตโนมัติ
                </div>
              </div>
            ) : (
              <div
                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  isOutOfSpec
                    ? 'bg-rose-50/80 border-rose-500 shadow-sm animate-pulse'
                    : 'bg-slate-50/80 border-[#467189]/40 focus-within:border-[#467189] focus-within:bg-white'
                }`}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={valueStr}
                  onChange={e => setValueStr(e.target.value)}
                  placeholder="0.0"
                  className={`w-full text-3xl sm:text-4xl font-extrabold tracking-tight bg-transparent outline-none ${
                    isOutOfSpec ? 'text-rose-600' : 'text-slate-900'
                  }`}
                />
                <span className="text-lg sm:text-xl font-bold text-slate-500 ml-2 whitespace-nowrap">
                  {currentParam.unit}
                </span>
              </div>
            )}

            {/* IMMEDIATE RED WARNING BANNER */}
            {!isUnreadable && isOutOfSpec && (
              <div className="p-3 rounded-xl bg-rose-600 text-white text-xs font-medium flex items-start gap-2.5 shadow-md">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-200" />
                <div className="space-y-0.5">
                  <div className="font-bold text-sm">
                    ⚠️ สัญญาณเตือน: ค่าหลุดเกณฑ์มาตรฐาน (OUT OF SPEC)!
                  </div>
                  <div>
                    {isBelowMin && (
                      <span>
                        ต่ำกว่าเกณฑ์ขั้นต่ำ (Min: {currentParam.min} {currentParam.unit}) วัดได้ {numValue} {currentParam.unit}
                      </span>
                    )}
                    {isAboveMax && (
                      <span>
                        สูงกว่าเกณฑ์สูงสุด (Max: {currentParam.max} {currentParam.unit}) วัดได้ {numValue} {currentParam.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stepper Delta Buttons & Numeric Keypad (only when reader is functioning) */}
          {!isUnreadable ? (
            <>
              {/* Quick Stepper Delta Buttons */}
              <div className="flex items-center gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => adjustValue(-1.0)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition"
                >
                  -1.0
                </button>
                <button
                  type="button"
                  onClick={() => adjustValue(-0.1)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition"
                >
                  -0.1
                </button>
                {currentParam.target !== undefined && (
                  <button
                    type="button"
                    onClick={() => setValueStr(String(currentParam.target))}
                    className="px-3 py-2 rounded-xl bg-[#467189]/15 hover:bg-[#467189]/25 active:scale-95 text-[#2B4B5D] font-bold text-xs transition whitespace-nowrap"
                    title="รีเซ็ตกลับเป็นค่า Target"
                  >
                    Target
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => adjustValue(0.1)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition"
                >
                  +0.1
                </button>
                <button
                  type="button"
                  onClick={() => adjustValue(1.0)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs transition"
                >
                  +1.0
                </button>
              </div>

              {/* Mobile Numeric Keypad */}
              <div className="bg-slate-100/70 p-2 rounded-2xl border border-slate-200/60">
                <div className="grid grid-cols-4 gap-1.5">
                  {['1', '2', '3', 'CLEAR', '4', '5', '6', 'BACK', '7', '8', '9', '+/-', '0', '.'].map(
                    key => {
                      const isSpecial = ['CLEAR', 'BACK', '+/-'].includes(key);
                      const isZero = key === '0';
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeypadPress(key)}
                          className={`py-2 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-2xs ${
                            isSpecial
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              : isZero
                              ? 'col-span-2 bg-white hover:bg-slate-50 text-slate-800 text-base'
                              : 'bg-white hover:bg-slate-50 text-slate-800 text-base'
                          }`}
                        >
                          {key === 'BACK' ? '⌫ ลบ' : key === 'CLEAR' ? 'ล้าง' : key}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              🔒 ปิดการป้อนตัวเลขชั่วคราวเนื่องจากตัวอ่านชำรุด หากต้องการกรอกตัวเลข ให้ยกเลิกการติ๊กตัวอ่านเสีย
            </div>
          )}

          {/* USER REQUIREMENT: ช่องเลือกกรณีต้องการหมายเหตุอะไรเผื่อเครื่องมีปัญหา */}
          {/* Checkbox / Toggle for Problem, Corrective Action & Notes */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setHasProblemRecord(prev => !prev)}
              className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between ${
                hasProblemRecord || isOutOfSpec
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {hasProblemRecord || isOutOfSpec ? (
                  <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-700" />
                    <span>บันทึกกรณีเครื่องมีปัญหา / หมายเหตุความผิดปกติ</span>
                  </div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                    คลิกเพื่อเปิดช่องระบุ ปัญหา, การแก้ไข และหมายเหตุ
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  hasProblemRecord || isOutOfSpec ? 'rotate-180 text-amber-600' : ''
                }`}
              />
            </button>

            {/* EXPANDED SECTION: ปัญหา / การแก้ไข / หมายเหตุ */}
            {(hasProblemRecord || isOutOfSpec) && (
              <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3.5 animate-fade-in">
                {/* 1. ปัญหา (Problem) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>ปัญหา (Problem / Issue):</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_PROBLEMS.slice(0, 4).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProblem(item)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-slate-700 hover:bg-amber-100 transition"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={problem}
                    onChange={e => setProblem(e.target.value)}
                    placeholder="ระบุลักษณะปัญหาที่พบ เช่น อุณหภูมิแกว่ง, มีเสียงเตือน, ประตูปิดไม่สนิท, ท่อก๊าซรั่วซึม..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* 2. การแก้ไข (Corrective Action) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>การแก้ไข (Corrective Action):</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_CORRECTIVE_ACTIONS.slice(0, 4).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCorrectiveAction(item)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-slate-700 hover:bg-amber-100 transition"
                      >
                        + {item.split(' ')[0]}...
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={correctiveAction}
                    onChange={e => setCorrectiveAction(e.target.value)}
                    placeholder="ระบุวิธีปฏิบัติการแก้ไข เช่น ปรับอุณหภูมิ, สลับถังสำรอง, ย้ายตัวอย่าง, แจ้งฝ่ายซ่อมบำรุง..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* 3. หมายเหตุ (Notes / Remarks) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>หมายเหตุ (Remarks / Notes):</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ระบุข้อสังเกตเพิ่มเติม เช่น เฝ้าระวังซ้ำใน 30 นาที, แจ้งหัวหน้าห้องแล็บเรียบร้อย..."
                    rows={1}
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Inspector Selection Dropdown (with the 8 MTs) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              ผู้ตรวจเช็ก (Medical Technologist):
            </label>
            <div className="relative">
              <select
                value={inspector}
                onChange={e => setInspector(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#35586C]"
              >
                {LAB_INSPECTORS.map(tech => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer (Action Buttons) */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-98 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isUnreadable && !isValidNumber}
            className={`flex-2 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 ${
              !isUnreadable && !isValidNumber
                ? 'bg-slate-300 cursor-not-allowed'
                : isUnreadable
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                : isOutOfSpec
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-[#35586C] hover:bg-[#284453] shadow-[#35586C]/20'
            }`}
          >
            {isUnreadable ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isUnreadable
                ? 'บันทึกสถานะตัวอ่านชำรุด'
                : isOutOfSpec
                ? 'บันทึกพร้อมแจ้งเตือน'
                : 'บันทึกข้อมูล (Save Log)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
