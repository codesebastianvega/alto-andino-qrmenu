/**
 * Shared admin UI primitives
 * Design tokens: Inter, rounded-xl cards, neutral grays, #2f4131 primary
 */

import { Icon } from '@iconify-icon/react';

/** Full page header — title, subtitle, optional badge, right slot */
export function PageHeader({ badge, title, subtitle, children }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
            {badge}
          </span>
        )}
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

/** Primary action button */
export function PrimaryButton({ onClick, children, type = 'button', className = '', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 bg-[#2f4131] text-white rounded-xl text-sm font-semibold hover:bg-[#243420] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/** Ghost / secondary button */
export function SecondaryButton({ onClick, children, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all ${className}`}
    >
      {children}
    </button>
  );
}

/** Small badge pill */
export function Badge({ children, variant = 'gray' }) {
  const styles = {
    green:  'bg-green-50  text-green-700  border-green-100',
    blue:   'bg-blue-50   text-blue-700   border-blue-100',
    red:    'bg-red-50    text-red-600    border-red-100',
    amber:  'bg-amber-50  text-amber-700  border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    gray:   'bg-gray-100  text-gray-600   border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${styles[variant] || styles.gray}`}>
      {children}
    </span>
  );
}

/** Table container with horizontal scroll */
export function TableContainer({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

/** Standard table column header cell */
export function Th({ children, right = false }) {
  return (
    <th className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

/** Search input with icon */
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="relative">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#2f4131] focus:border-transparent outline-none transition-all"
      />
    </div>
  );
}

/** Standard select dropdown */
export function SelectInput({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#2f4131] focus:border-transparent outline-none transition-all"
    >
      {children}
    </select>
  );
}

/** Standard form field */
export function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Text input */
export function TextInput({ value, onChange, placeholder, type = 'text', required, name, className = '' }) {
  return (
    <input
      type={type}
      required={required}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#2f4131] focus:bg-white focus:border-transparent outline-none transition-all ${className}`}
    />
  );
}

/** Modal overlay + container */
export function Modal({ children, onClose, wide = false }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl w-full shadow-2xl my-auto transition-all ${wide ? 'max-w-4xl' : 'max-w-xl'} animate-in fade-in zoom-in-95 duration-200`}>
        {children}
      </div>
    </div>
  );
}

/** Modal header */
export function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between px-7 py-5 border-b border-gray-100">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        className="ml-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

/** 
 * Side Drawer (Slide-over) container 
 * Slides from the right on desktop, bottom on mobile
 */
export function Drawer({ children, isOpen, onClose, title, subtitle }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform transition-all animate-in slide-in-from-right duration-500 ease-out">
          <div className="flex h-full flex-col overflow-y-auto bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white/20">
            {/* Header */}
            <div className="px-6 py-6 border-b border-gray-100/50">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
                  {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all"
                >
                  <Icon icon="heroicons:x-mark" className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 px-6 py-6 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bento-style inner card for grouping fields */
export function BentoCard({ children, title, className = '' }) {
  return (
    <div className={`bg-gray-50/50 border border-gray-100 rounded-2xl p-5 ${className}`}>
      {title && (
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
          {title}
        </h4>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/** Glassmorphism effect container */
export function GlassContainer({ children, className = '' }) {
  return (
    <div className={`bg-white/40 backdrop-blur-md border border-white/20 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** 
 * Overlay for locked features 
 * Prevents interaction and shows upgrade message
 */
export function LockOverlay({ featureName }) {
  return (
    <div className="absolute inset-0 z-[60] backdrop-blur-[2px] bg-white/40 flex items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-10 max-w-md border border-amber-200/50 shadow-2xl shadow-amber-900/10 flex flex-col items-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-amber-50/50">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Módulo No Disponible</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-8">
          El módulo de <span className="font-bold text-gray-900">{featureName}</span> no está incluido en tu plan actual. Actualiza tu suscripción para desbloquear esta funcionalidad.
        </p>
        <button 
          onClick={() => window.open('https://aluna.app/precios', '_blank')}
          className="w-full py-3.5 bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-600/20 hover:bg-amber-700 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          Ver Planes y Precios
        </button>
      </div>
    </div>
  );
}
