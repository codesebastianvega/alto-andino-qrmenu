import React from 'react';
import { Icon } from '@iconify-icon/react';

export default function ExperiencesHeader({
  activeTab,
  setActiveTab,
  onNewExperience,
}) {
  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 border-l-4 border-[#2f4131] pl-4">
            EXPERIENCIAS
          </h1>
          <p className="text-gray-500 mt-1 font-medium pl-4">
            Catas, talleres, cenas temáticas y más
          </p>
        </div>
        <button
          onClick={onNewExperience}
          className="bg-[#2f4131] hover:bg-[#1a251b] text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Icon icon="heroicons:plus" className="text-xl" /> Nueva Experiencia
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('experiencias')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'experiencias'
              ? 'bg-white text-[#2f4131] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon icon="heroicons:sparkles" /> Experiencias
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'leads'
              ? 'bg-white text-[#2f4131] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon icon="heroicons:users" /> Todos los Leads
        </button>
      </div>
    </>
  );
}
