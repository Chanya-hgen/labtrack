import React, { useState } from 'react';
import { LabEquipment, EquipmentParameter, EquipmentCategory } from '../types';
import { X, Plus, Trash2, Settings, Sliders, CheckCircle } from 'lucide-react';

interface EquipmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit: LabEquipment | null;
  onSave: (equipment: LabEquipment) => void;
  onDelete?: (id: string) => void;
}

const PRESET_PARAMETERS = [
  { name: 'อุณหภูมิ', defaultUnit: '°C', defaultMin: 20.0, defaultMax: 24.0, defaultTarget: 22.0, defaultStep: 0.1 },
  { name: 'ความเข้มข้น CO2', defaultUnit: '%', defaultMin: 4.8, defaultMax: 5.2, defaultTarget: 5.0, defaultStep: 0.1 },
  { name: 'ความเข้มข้น O2', defaultUnit: '%', defaultMin: 4.5, defaultMax: 5.5, defaultTarget: 5.0, defaultStep: 0.1 },
  { name: 'ความชื้น', defaultUnit: '%', defaultMin: 40.0, defaultMax: 60.0, defaultTarget: 50.0, defaultStep: 0.5 },
];

const PRESET_UNITS = ['°C', '%'];

export const EquipmentManagerModal: React.FC<EquipmentManagerModalProps> = ({
  isOpen,
  onClose,
  equipmentToEdit,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(equipmentToEdit);

  // Form State
  const [id, setId] = useState<string>(equipmentToEdit?.id || '');
  const [name, setName] = useState<string>(equipmentToEdit?.name || '');
  const [category, setCategory] = useState<EquipmentCategory>(
    equipmentToEdit?.departmentUnit || equipmentToEdit?.category || 'chromosome_analysis'
  );
  const [location, setLocation] = useState<string>(
    equipmentToEdit?.location || ''
  );
  const [model, setModel] = useState<string>(equipmentToEdit?.model || '');
  const [serialNumber, setSerialNumber] = useState<string>(
    equipmentToEdit?.serialNumber || ''
  );

  // Parameters list
  const [parameters, setParameters] = useState<EquipmentParameter[]>(
    equipmentToEdit?.parameters || [
      {
        id: 'temp_c',
        name: 'อุณหภูมิ',
        unit: '°C',
        min: 20.0,
        max: 24.0,
        target: 22.0,
        step: 0.1,
      },
    ]
  );

  // State to track if parameter name or unit is set to custom input mode
  const [customNameIndices, setCustomNameIndices] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    const existing = equipmentToEdit?.parameters || [];
    existing.forEach((p, idx) => {
      if (!PRESET_PARAMETERS.some(preset => preset.name === p.name)) {
        map[idx] = true;
      }
    });
    return map;
  });

  const [customUnitIndices, setCustomUnitIndices] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    const existing = equipmentToEdit?.parameters || [];
    existing.forEach((p, idx) => {
      if (!PRESET_UNITS.includes(p.unit)) {
        map[idx] = true;
      }
    });
    return map;
  });

  // Parameter manipulation
  const handleAddParam = () => {
    const newId = `param_${Date.now()}`;
    const newIndex = parameters.length;
    setParameters(prev => [
      ...prev,
      {
        id: newId,
        name: 'อุณหภูมิ',
        unit: '°C',
        min: 20.0,
        max: 24.0,
        target: 22.0,
        step: 0.1,
      },
    ]);
    setCustomNameIndices(prev => ({ ...prev, [newIndex]: false }));
    setCustomUnitIndices(prev => ({ ...prev, [newIndex]: false }));
  };

  const handleUpdateParam = (index: number, field: keyof EquipmentParameter, value: any) => {
    setParameters(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSelectParamName = (index: number, selectedValue: string) => {
    if (selectedValue === '__custom__') {
      setCustomNameIndices(prev => ({ ...prev, [index]: true }));
      handleUpdateParam(index, 'name', '');
    } else {
      setCustomNameIndices(prev => ({ ...prev, [index]: false }));
      const found = PRESET_PARAMETERS.find(p => p.name === selectedValue);
      if (found) {
        setParameters(prev => {
          const copy = [...prev];
          copy[index] = {
            ...copy[index],
            name: found.name,
            unit: found.defaultUnit,
            min: found.defaultMin,
            max: found.defaultMax,
            target: found.defaultTarget,
            step: found.defaultStep,
          };
          return copy;
        });
        setCustomUnitIndices(prev => ({ ...prev, [index]: !PRESET_UNITS.includes(found.defaultUnit) }));
      } else {
        handleUpdateParam(index, 'name', selectedValue);
      }
    }
  };

  const handleSelectUnit = (index: number, selectedUnit: string) => {
    if (selectedUnit === '__custom__') {
      setCustomUnitIndices(prev => ({ ...prev, [index]: true }));
      handleUpdateParam(index, 'unit', '');
    } else {
      setCustomUnitIndices(prev => ({ ...prev, [index]: false }));
      handleUpdateParam(index, 'unit', selectedUnit);
    }
  };

  const handleRemoveParam = (index: number) => {
    if (parameters.length <= 1) {
      alert('เครื่องมือต้องมีตัวชี้วัดอย่างน้อย 1 รายการ');
      return;
    }
    setParameters(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id.trim() || !name.trim()) {
      alert('กรุณาระบุเลขครุภัณฑ์และชื่อเครื่องมือให้ครบถ้วน');
      return;
    }

    // Validate parameters
    for (const p of parameters) {
      if (!p.name.trim()) {
        alert('กรุณาระบุชื่อตัวชี้วัดให้ครบถ้วน');
        return;
      }
      if (!p.unit.trim()) {
        alert(`กรุณาระบุหน่วยของตัวชี้วัด "${p.name}"`);
        return;
      }
      if (p.min >= p.max) {
        alert(`ตัวชี้วัด "${p.name}": ค่าต่ำสุด (${p.min}) ต้องน้อยกว่าค่าสูงสุด (${p.max})`);
        return;
      }
    }

    const payload: LabEquipment = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      category,
      departmentUnit: category,
      location: location.trim() || 'ห้องแล็บทั่วไป',
      model: model.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      active: true,
      parameters,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#35586C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-cyan-200" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {isEditing ? 'แก้ไขข้อมูลเครื่องมือ' : 'เพิ่มเครื่องมือใหม่'}
              </h3>
              <p className="text-xs text-cyan-100">
                กำหนดเลขครุภัณฑ์ หน่วยงาน และช่วงค่าปกติที่ยอมรับได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {/* ข้อมูลพื้นฐานของเครื่องมือ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* เลขครุภัณฑ์ */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                เลขครุภัณฑ์ *
              </label>
              <input
                type="text"
                required
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="เช่น 6630-001-0001, INC-CHR-01"
                disabled={isEditing}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#35586C] font-mono text-xs uppercase"
              />
            </div>

            {/* หน่วยงาน (ภาษาอังกฤษตามคำขอ) */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                หน่วยงาน *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as EquipmentCategory)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#35586C] text-xs font-semibold text-slate-800"
              >
                <option value="chromosome_analysis">Chromosome Analysis</option>
                <option value="reproductive_biology">Reproductive Biology</option>
                <option value="molecular_genetics">Molecular Genetics</option>
                <option value="other">Other Unit</option>
              </select>
            </div>

            {/* ชื่อเครื่องมือ / จุดตรวจ */}
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                ชื่อเครื่องมือ / จุดตรวจ *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="เช่น ตู้บ่มเซลล์ CO2 Incubator #1"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#35586C] text-xs"
              />
            </div>

            {/* สถานที่ตั้ง */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                สถานที่ตั้ง / ห้องปฏิบัติการ
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="เช่น ห้องเพาะเลี้ยงเซลล์ ชั้น 3"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#35586C] text-xs"
              />
            </div>

            {/* รุ่น / Serial Number */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                รุ่นเครื่อง / หมายเลขเครื่อง (ถ้ามี)
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="เช่น Model: Steri-Cycle 371"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#35586C] text-xs"
              />
            </div>
          </div>

          {/* รายการตัวชี้วัดและช่วงเกณฑ์ปกติ */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#467189]" />
                  เกณฑ์มาตรฐานที่ยอมรับได้ (ช่วงค่าปกติ)
                </h4>
                <p className="text-[11px] text-slate-500">
                  หากกรอกค่าหลุดจากช่วงต่ำสุด-สูงสุดนี้ ระบบจะแสดงสัญญาณเตือนสีแดงทันที
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddParam}
                className="px-2.5 py-1.5 rounded-xl bg-[#467189]/10 text-[#35586C] hover:bg-[#467189]/20 font-bold text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มตัวชี้วัด
              </button>
            </div>

            <div className="space-y-3">
              {parameters.map((param, index) => {
                const isCustomName = customNameIndices[index] || (!PRESET_PARAMETERS.some(p => p.name === param.name) && param.name !== '');
                const isCustomUnit = customUnitIndices[index] || (!PRESET_UNITS.includes(param.unit) && param.unit !== '');

                return (
                  <div
                    key={param.id || index}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#467189] px-2 py-0.5 rounded-md bg-[#467189]/10">
                        ตัวชี้วัด #{index + 1}
                      </span>
                      {parameters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(index)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition"
                          title="ลบตัวชี้วัดนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {/* ตัวชี้วัด (Dropdown + ให้พิมพ์เองถ้าเลือกอื่นๆ) */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] text-slate-600 font-semibold block">
                          ตัวชี้วัด *
                        </label>
                        <select
                          value={isCustomName ? '__custom__' : param.name}
                          onChange={e => handleSelectParamName(index, e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-[#35586C]"
                        >
                          {PRESET_PARAMETERS.map(preset => (
                            <option key={preset.name} value={preset.name}>
                              {preset.name}
                            </option>
                          ))}
                          <option value="__custom__">+ ระบุตัวชี้วัดอื่นๆ...</option>
                        </select>

                        {/* ช่องพิมพ์กรณีเลือกตัวชี้วัดอื่นๆ */}
                        {isCustomName && (
                          <input
                            type="text"
                            required
                            value={param.name}
                            onChange={e => handleUpdateParam(index, 'name', e.target.value)}
                            placeholder="พิมพ์ชื่อตัวชี้วัด เช่น แรงดันก๊าซ, ระดับ VOC"
                            className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 animate-fade-in"
                          />
                        )}
                      </div>

                      {/* หน่วย (Dropdown °C, %) */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-600 font-semibold block">
                          หน่วย *
                        </label>
                        <select
                          value={isCustomUnit ? '__custom__' : param.unit}
                          onChange={e => handleSelectUnit(index, e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-[#35586C]"
                        >
                          <option value="°C">°C</option>
                          <option value="%">%</option>
                          <option value="__custom__">+ ระบุหน่วยอื่นๆ...</option>
                        </select>

                        {/* ช่องพิมพ์กรณีเลือกหน่วยอื่นๆ */}
                        {isCustomUnit && (
                          <input
                            type="text"
                            required
                            value={param.unit}
                            onChange={e => handleUpdateParam(index, 'unit', e.target.value)}
                            placeholder="เช่น bar, ppm, psi"
                            className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 animate-fade-in"
                          />
                        )}
                      </div>

                      {/* ค่าเป้าหมาย (ถ้ามี) */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-600 font-semibold block">
                          ค่าเป้าหมาย
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={param.target ?? ''}
                          onChange={e =>
                            handleUpdateParam(
                              index,
                              'target',
                              e.target.value === '' ? undefined : parseFloat(e.target.value)
                            )
                          }
                          placeholder="เช่น 37.0 หรือ 5.0"
                          className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>

                    {/* ค่าต่ำสุด (Min) และ ค่าสูงสุด (Max) */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                      <div>
                        <label className="text-[10px] text-rose-700 font-bold block mb-0.5">
                          เกณฑ์ต่ำสุดที่ยอมรับได้ (Min) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={param.min}
                          onChange={e => handleUpdateParam(index, 'min', parseFloat(e.target.value))}
                          placeholder="เช่น 36.8"
                          className="w-full p-2 rounded-xl border border-rose-200 bg-white text-xs font-bold text-rose-700"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-rose-700 font-bold block mb-0.5">
                          เกณฑ์สูงสุดที่ยอมรับได้ (Max) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={param.max}
                          onChange={e => handleUpdateParam(index, 'max', parseFloat(e.target.value))}
                          placeholder="เช่น 37.2"
                          className="w-full p-2 rounded-xl border border-rose-200 bg-white text-xs font-bold text-rose-700"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons ด้านล่าง */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {isEditing && onDelete && equipmentToEdit ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`คุณต้องการลบเครื่องมือ "${name}" หรือไม่? ข้อมูลบันทึกเก่าจะยังคงอยู่`)) {
                    onDelete(equipmentToEdit.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition"
              >
                ลบเครื่องมือนี้
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-[#35586C] hover:bg-[#2B4B5D] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
