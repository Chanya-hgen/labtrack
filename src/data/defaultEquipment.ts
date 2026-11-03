import { LabEquipment, LabSettings, LabDepartmentUnit } from '../types';

export const LAB_INSPECTORS = [
  'Phatwalan Kabklang MT.8296',
  'Kannapat Kesornsukone MT.7635',
  'Chanya Pawong MT.19843',
  'Wayu Patitas MT.23026',
  'Roongrudee Singdong MT.6512',
  'Nopasorn Saipim MT.23372',
  'Natthakul Akarapredee MT.20648',
  'Kunvara Orachon MT.23515',
];

export const DEFAULT_LAB_SETTINGS: LabSettings = {
  labName: 'Rajavithi Hospital (โรงพยาบาลราชวิถี)',
  department: 'Division of Human Genetics, Department of Clinical Pathology and Medical Technology',
  standardReference: 'Daily Equipment Tracker',
  defaultInspector: 'Chanya Pawong MT.19843',
  soundAlert: true,
  vibrationAlert: true,
};

export const DEPARTMENT_UNIT_CONFIG: Record<
  LabDepartmentUnit,
  { label: string; labelTh: string; color: string; badgeClass: string; icon: string }
> = {
  chromosome_analysis: {
    label: 'Chromosome Analysis',
    labelTh: 'การตรวจวิเคราะห์โครโมโซม',
    color: '#3B82F6',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'Dna',
  },
  reproductive_biology: {
    label: 'Reproductive Biology',
    labelTh: 'ชีววิทยาการเจริญพันธุ์ / IVF',
    color: '#0D9488',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: 'Sparkles',
  },
  molecular_genetics: {
    label: 'Molecular Genetics',
    labelTh: 'พันธุศาสตร์ระดับโมเลกุล',
    color: '#6366F1',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'Microscope',
  },
  other: {
    label: 'Other Unit',
    labelTh: 'หน่วยงานอื่นๆ',
    color: '#64748B',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: 'Sliders',
  },
};

// Initial equipment list is clean (empty array) for entering real hospital equipment
export const DEFAULT_EQUIPMENT_LIST: LabEquipment[] = [];
