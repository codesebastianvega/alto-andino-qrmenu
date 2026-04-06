import React from "react";

export default function InteractivePhone() {
  return (
    <div className="relative shrink-0 w-[330px] h-[660px] bg-[#F5F5F7] rounded-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.25)] border-[12px] border-[#1A1A1A] overflow-hidden flex flex-col ring-1 ring-white/20">
      {/* Hardware Buttons */}
      <div className="absolute -left-[14px] top-[120px] w-[3px] h-[26px] bg-[#1A1A1A] rounded-l-md pointer-events-none"></div>
      <div className="absolute -left-[14px] top-[160px] w-[3px] h-[45px] bg-[#1A1A1A] rounded-l-md pointer-events-none"></div>
      <div className="absolute -left-[14px] top-[215px] w-[3px] h-[45px] bg-[#1A1A1A] rounded-l-md pointer-events-none"></div>
      <div className="absolute -right-[14px] top-[180px] w-[3px] h-[65px] bg-[#1A1A1A] rounded-r-md pointer-events-none"></div>

      {/* Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-[#1A1A1A] rounded-full z-[60] flex items-center justify-between px-2 pointer-events-none shadow-sm">
        <div className="w-2 h-2 rounded-full bg-[#0A0A0A] border border-white/5"></div>
        <div className="w-2 h-2 rounded-full bg-[#0A0A0A] border border-white/5"></div>
      </div>

      {/* Iframe del Menú Real de Alto Andino */}
      <div className="w-full h-full relative z-10 bg-[#F5F5F7]">
        <iframe
          src="/alto-andino/?demo=1#menu"
          title="Menú Real Alto Andino"
          className="border-none absolute left-0"
          style={{ 
            top: '32px',
            width: '390px', 
            height: '770px', 
            transform: 'scale(0.7846)', 
            transformOrigin: 'top left',
            pointerEvents: 'auto' 
          }}
        />
      </div>
    </div>
  );
}
