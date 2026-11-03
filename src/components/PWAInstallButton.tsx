import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-[#467189] text-white font-medium shadow-sm hover:bg-[#35586C] active:scale-95 transition-all ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
        }`}
        title="ติดตั้งแอปพลิเคชันลงในโทรศัพท์"
      >
        <Download className="w-3.5 h-3.5 text-cyan-200" />
        <span>ติดตั้งแอป (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/80 backdrop-blur text-slate-700 font-medium hover:bg-slate-50 active:scale-95 transition-all ${
            compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
          }`}
          title="ติดตั้งบน iPhone/iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#467189]" />
          <span>ติดตั้งบน iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#467189]/10 flex items-center justify-center text-[#467189]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">ติดตั้ง LabTrack บน iPhone / iPad</h3>
                    <p className="text-xs text-slate-500">เปิดแบบเต็มหน้าจอ ไม่ต้องพิมพ์ URL ซ้ำ</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-600">
                <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-[#467189] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    แตะที่ปุ่ม <strong className="inline-flex items-center gap-1 text-slate-800"><Share className="w-3.5 h-3.5 inline text-sky-600" /> แชร์ (Share)</strong> ที่แถบเมนูด้านล่างของ Safari
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-[#467189] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    เลื่อนลงมาแล้วเลือก <strong className="inline-flex items-center gap-1 text-slate-800"><PlusSquare className="w-3.5 h-3.5 inline text-sky-600" /> เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-[#467189] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <div>
                    แตะปุ่ม <strong className="text-[#467189]">เพิ่ม (Add)</strong> ที่มุมขวาบน จะมีไอคอน LabTrack บนหน้าจอโทรศัพท์พร้อมใช้งานแบบออฟไลน์
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#467189] py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#35586C] transition shadow-sm"
              >
                เข้าใจแล้ว ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback demo button for desktop/mobile browsers that gives a quick tip
  return (
    <button
      onClick={() => alert('คุณสามารถกดเมนูเบราว์เซอร์ (⋮ หรือ Share) แล้วเลือก "เพิ่มลงในหน้าจอหลัก" เพื่อติดตั้งแอปพลิเคชัน LabTrack')}
      className={`hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/70 backdrop-blur px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 active:scale-95 transition-all`}
    >
      <Download className="w-3.5 h-3.5 text-[#467189]" />
      <span>ติดตั้ง App</span>
    </button>
  );
};
