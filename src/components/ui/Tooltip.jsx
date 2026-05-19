import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function Tooltip({ text, children }) {
  return (
    <div className="group relative flex items-center gap-1.5 cursor-help">
      {children}
      <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-[#2D6A4F] transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[250px] md:max-w-xs px-3 py-2 bg-[#1A1A1A] text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]"></div>
      </div>
    </div>
  );
}
