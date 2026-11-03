export type LabDepartmentUnit = 
  | 'chromosome_analysis'
  | 'reproductive_biology'
  | 'molecular_genetics'
  | 'other';

export type EquipmentCategory = LabDepartmentUnit;

export interface EquipmentParameter {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  target?: number;
  step?: number;
  description?: string;
}

export interface LabEquipment {
  id: string;             // e.g. "INC-REP-01"
  name: string;           // e.g. "ตู้บ่ม CO2 Incubator #1"
  category: EquipmentCategory;
  departmentUnit: LabDepartmentUnit;
  location: string;       // e.g. "ห้องเพาะเลี้ยง IVF Lab"
  model?: string;
  serialNumber?: string;
  parameters: EquipmentParameter[];
  active: boolean;
  notes?: string;
}

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'routine';

export interface MonitoringLogEntry {
  id: string;
  timestamp: string;      // ISO 8601 string: 2026-11-02T17:47:15.000Z
  equipmentId: string;
  equipmentName: string;
  departmentUnit?: LabDepartmentUnit;
  parameterId: string;
  parameterName: string;
  unit: string;
  value: number | null;
  min: number;
  max: number;
  isOutOfSpec: boolean;
  isUnreadable?: boolean;     // ตัวอ่านเสีย / ไม่สามารถอ่านค่าได้
  inspectorName: string;      // e.g. "Chanya Pawong MT.19843"
  inspectorRole?: string;
  shift: ShiftType;
  // ช่องบันทึกกรณีเครื่องมีปัญหาตามที่ผู้ใช้กำหนด
  hasProblem?: boolean;       // ระบุว่าพบปัญหาหรือไม่
  problem?: string;          // 1. ปัญหา
  correctiveAction?: string; // 2. การแก้ไข
  notes?: string;            // 3. หมายเหตุ
}

export interface LabSettings {
  labName: string;
  department: string;
  standardReference: string; // e.g. "ISO 15189:2022"
  defaultInspector: string;
  soundAlert: boolean;
  vibrationAlert: boolean;
}
