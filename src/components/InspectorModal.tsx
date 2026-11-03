import React from 'react';
import { LAB_INSPECTORS } from '../data/defaultEquipment';
import { User, X, Check, Award, ShieldCheck } from 'lucide-react';

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInspector: string;
  onSelectInspector: (name: string) => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  isOpen,
  onClose,
  currentInspector,
  onSelectInspector,
}) => {
  if (!isOpen) return null;

  const handleSelect = (name: string) => {
    onSelectInspector(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#35586C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-200" />
            <div>
              <h3 className="font-bold text-sm">ผู้บันทึก (Medical Technologist)</h3>
              <p className="text-[11px] text-cyan-100">เลือกชื่อนักเทคนิคการแพทย์ประจำเวร</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2 max-h-[75vh] overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            รายชื่อนักเทคนิคการแพทย์ ({LAB_INSPECTORS.length} ท่าน):
          </div>

          <div className="space-y-1.5">
            {LAB_INSPECTORS.map(tech => {
              const isSelected = currentInspector === tech;
              return (
                <button
                  key={tech}
                  onClick={() => handleSelect(tech)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                    isSelected
                      ? 'border-[#35586C] bg-[#467189]/10 font-bold text-[#204051] shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-[#35586C] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tech.split(' ')[0].charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{tech}</div>
                      <div className="text-[10px] text-slate-500">
                        นักเทคนิคการแพทย์ (MT Lic.)
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#35586C]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            ระบบจะจำชื่อผู้บันทึกอัตโนมัติสำหรับการเดินตรวจจุดต่อไป
          </p>
        </div>
      </div>
    </div>
  );
};
