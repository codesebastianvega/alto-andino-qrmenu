export default function AdminBranding() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl text-amber-500">🎨</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Módulo de Branding</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Personaliza los colores, logos y tipografías de tu menú digital. 
          Esta sección está actualmente bajo desarrollo como parte del Roadmap SaaS.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          Próximamente
        </div>
      </div>
    </div>
  );
}
