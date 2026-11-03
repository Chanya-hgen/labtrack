import { useState, useEffect, useCallback } from 'react';
import { LabEquipment, MonitoringLogEntry, LabSettings } from '../types';
import { DEFAULT_EQUIPMENT_LIST, DEFAULT_LAB_SETTINGS, DEPARTMENT_UNIT_CONFIG } from '../data/defaultEquipment';
import { generateSampleLogs } from '../data/sampleLogs';

const STORAGE_KEY_EQUIPMENT = 'labtrack_equipment_v3_clean';
const STORAGE_KEY_LOGS = 'labtrack_logs_v3_clean';
const STORAGE_KEY_SETTINGS = 'labtrack_settings_v3_clean';

export function useLabData() {
  const [equipmentList, setEquipmentList] = useState<LabEquipment[]>(() => {
    try {
      // Proactively clear legacy sample data so user gets a completely clean slate
      localStorage.removeItem('labtrack_equipment');
      localStorage.removeItem('labtrack_logs');
      localStorage.removeItem('labtrack_equipment_v2');
      localStorage.removeItem('labtrack_logs_v2');

      const saved = localStorage.getItem(STORAGE_KEY_EQUIPMENT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading equipment from localStorage', e);
    }
    return DEFAULT_EQUIPMENT_LIST;
  });

  const [logs, setLogs] = useState<MonitoringLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading logs from localStorage', e);
    }
    return generateSampleLogs();
  });

  const [settings, setSettings] = useState<LabSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading settings from localStorage', e);
    }
    return DEFAULT_LAB_SETTINGS;
  });

  // Persist whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPMENT, JSON.stringify(equipmentList));
    } catch (e) {
      console.error('Failed to save equipment', e);
    }
  }, [equipmentList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  // Add new log entry
  const addLog = useCallback((newEntry: Omit<MonitoringLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const timestamp = newEntry.timestamp || new Date().toISOString();
    const entry: MonitoringLogEntry = {
      ...newEntry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
    };

    setLogs(prev => [entry, ...prev]);

    // Update last checked time on the equipment
    setEquipmentList(prev =>
      prev.map(eq =>
        eq.id === entry.equipmentId
          ? { ...eq, lastCheckedAt: timestamp }
          : eq
      )
    );

    return entry;
  }, []);

  // Delete a log
  const deleteLog = useCallback((id: string) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  }, []);

  // Update or Add equipment
  const saveEquipment = useCallback((equipment: LabEquipment) => {
    setEquipmentList(prev => {
      const exists = prev.some(eq => eq.id === equipment.id);
      if (exists) {
        return prev.map(eq => (eq.id === equipment.id ? equipment : eq));
      }
      return [...prev, equipment];
    });
  }, []);

  // Delete equipment
  const deleteEquipment = useCallback((id: string) => {
    setEquipmentList(prev => prev.filter(eq => eq.id !== id));
  }, []);

  // Reset to default sample state
  const resetToDefaults = useCallback(() => {
    setEquipmentList(DEFAULT_EQUIPMENT_LIST);
    const freshLogs = generateSampleLogs();
    setLogs(freshLogs);
    setSettings(DEFAULT_LAB_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_EQUIPMENT);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  }, []);

  // Export to Excel/CSV with ISO 15189 compliance header and 3 incident fields (ปัญหา, การแก้ไข, หมายเหตุ)
  const exportToCSV = useCallback(() => {
    if (logs.length === 0) {
      return false;
    }

    const headers = [
      'Log ID',
      'วันที่ (Date)',
      'เวลา (Time)',
      'Timestamp เต็ม',
      'หน่วยงาน (Department)',
      'รหัสเครื่อง (Equipment ID)',
      'ชื่อเครื่องมือ (Equipment Name)',
      'สถานที่ตั้ง (Location)',
      'พารามิเตอร์',
      'ค่าที่วัดได้',
      'หน่วย',
      'เกณฑ์ต่ำสุด (Min)',
      'เกณฑ์สูงสุด (Max)',
      'สถานะการตรวจ',
      'รอบเวร (Shift)',
      'ผู้บันทึก (Inspector MT.)',
      'ปัญหา (Problem / Issue)',
      'การแก้ไข (Corrective Action)',
      'หมายเหตุ (Remarks / Notes)'
    ];

    const rows = logs.map(log => {
      const dt = new Date(log.timestamp);
      const dateStr = dt.toISOString().split('T')[0];
      const timeStr = dt.toLocaleTimeString('th-TH', { hour12: false });
      const eq = equipmentList.find(e => e.id === log.equipmentId);
      const location = eq?.location || '-';
      const dept = eq?.departmentUnit 
        ? DEPARTMENT_UNIT_CONFIG[eq.departmentUnit]?.label || eq.departmentUnit
        : (log.departmentUnit ? DEPARTMENT_UNIT_CONFIG[log.departmentUnit]?.label || log.departmentUnit : '-');

      const status = log.isUnreadable
        ? 'DEFECTIVE (ตัวอ่านชำรุด/อ่านค่าไม่ได้)'
        : log.isOutOfSpec
        ? 'OUT_OF_SPEC (หลุดเกณฑ์)'
        : 'IN_SPEC (ปกติ)';
      const valDisplay = log.isUnreadable || log.value === null ? 'ตัวอ่านเสีย/อ่านค่าไม่ได้' : log.value;
      const safe = (val: string | number | undefined | null) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      return [
        safe(log.id),
        safe(dateStr),
        safe(timeStr),
        safe(log.timestamp),
        safe(dept),
        safe(log.equipmentId),
        safe(log.equipmentName),
        safe(location),
        safe(log.parameterName),
        safe(valDisplay),
        safe(log.unit),
        safe(log.min),
        safe(log.max),
        safe(status),
        safe(log.shift === 'morning' ? 'รอบเช้า' : 'รอบบ่าย'),
        safe(log.inspectorName),
        safe(log.problem || '-'),
        safe(log.correctiveAction || '-'),
        safe(log.notes || '-')
      ].join(',');
    });

    // Add UTF-8 BOM so Microsoft Excel opens Thai characters cleanly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Daily_Equipment_Temperature_Log_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }, [logs, equipmentList]);

  // Export full JSON Backup
  const exportToJSON = useCallback(() => {
    const backupData = {
      version: '2.0',
      systemName: 'แบบบันทึกอุณหภูมิ',
      exportedAt: new Date().toISOString(),
      settings,
      equipment: equipmentList,
      logs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `แบบบันทึกอุณหภูมิ_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [settings, equipmentList, logs]);

  // Import JSON Backup
  const importFromJSON = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.equipment) && Array.isArray(data.logs)) {
        setEquipmentList(data.equipment);
        setLogs(data.logs);
        if (data.settings) setSettings(data.settings);
        return { success: true, count: data.logs.length };
      }
      return { success: false, error: 'รูปแบบไฟล์ไม่ถูกต้อง ขาด equipment หรือ logs' };
    } catch (e) {
      return { success: false, error: 'ไม่สามารถอ่านไฟล์ JSON ได้' };
    }
  }, []);

  return {
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
  };
}
