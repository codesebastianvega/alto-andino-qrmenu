import React from 'react';
import { Icon } from '@iconify-icon/react';
import { Link as LinkIcon } from 'lucide-react';
import { PrimaryButton } from '../ui';

export default function ModifierGroupsHeader({
  isAllLocations,
  activeTab,
  setActiveTab,
  onOpenLinkModal,
  onOpenCreateGroup,
}) {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2f4131]/10 rounded-2xl flex items-center justify-center text-[#2f4131]">
            <Icon icon="heroicons:sparkles" className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2f4131]">Extras y Modificadores</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configura las opciones que complementan o alteran tus platos.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!isAllLocations && (
            <button
              onClick={onOpenLinkModal}
              className="flex items-center justify-center gap-2 px-4 h-[42px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all border border-indigo-100 shadow-sm w-full sm:w-auto cursor-pointer"
            >
              <LinkIcon size={18} />
              Vincular del Catálogo
            </button>
          )}
          <PrimaryButton onClick={onOpenCreateGroup} className="h-[42px] px-6 cursor-pointer">
            <Icon icon="heroicons:plus-circle" className="text-xl" />
            Crear Grupo
          </PrimaryButton>
        </div>
      </div>

      <div className="flex flex-row overflow-x-auto scrollbar-hide ios-smooth-scroll flex-nowrap bg-gray-50 p-1.5 rounded-2xl w-full sm:w-fit mx-auto border border-gray-100">
        <button
          onClick={() => setActiveTab('main')}
          className={`whitespace-nowrap shrink-0 px-4 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'main'
              ? 'bg-white text-[#2f4131] shadow-md border border-gray-100'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon
            icon="heroicons:list-bullet"
            className={activeTab === 'main' ? 'text-[#2f4131]' : 'text-gray-400'}
          />
          Modificadores Principales
        </button>
        <button
          onClick={() => setActiveTab('sub')}
          className={`whitespace-nowrap shrink-0 px-4 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sub'
              ? 'bg-white text-[#2f4131] shadow-md border border-gray-100'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Icon
            icon="heroicons:tag"
            className={activeTab === 'sub' ? 'text-[#2f4131]' : 'text-gray-400'}
          />
          Sub-Modificadores (Atributos)
        </button>
      </div>
    </>
  );
}
