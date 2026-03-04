import React, { Suspense, lazy } from 'react';

// Using the existing component we removed from App.jsx
const ExperiencesSection = lazy(() => import('../components/ExperiencesSection'));

export default function ExperiencesPage() {
  return (
    <div className="bg-[#F5F5F7] min-h-screen pb-24 lg:pb-8">
      <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-5 pt-8 sm:px-6 md:px-8">
        <h1 className="text-3xl font-serif text-alto-text mb-6">Nuestras Experiencias</h1>
        <p className="text-lg text-neutral-600 mb-8 max-w-2xl">
          Eventos únicos, catas de café, talleres y más. Vive Alto Andino más allá de la carta.
        </p>
        
        <Suspense fallback={
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-alto-green"></div>
          </div>
        }>
          <ExperiencesSection />
        </Suspense>
      </div>
    </div>
  );
}
