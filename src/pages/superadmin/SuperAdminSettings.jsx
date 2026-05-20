import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Sparkles, Mail, Shield, Save, AlertTriangle, Palette } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsId, setSettingsId] = useState(null);
  const [typography, setTypography] = useState('inter');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching global settings:', error);
      }
      
      if (data) {
        setSettingsId(data.id);
        setTypography(data.typography || 'inter');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (settingsId) {
        await supabase
          .from('global_settings')
          .update({ typography })
          .eq('id', settingsId);
      } else {
        const { data, error } = await supabase
          .from('global_settings')
          .insert([{ typography }])
          .select()
          .single();
        if (data) setSettingsId(data.id);
      }
      
      // Reload the page to apply layout changes
      window.location.reload();
    } catch (err) {
      console.error('Error saving global settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Configuración General</h3>
              <p className="text-sm text-gray-500 mb-4">Ajustes básicos y estado global de la plataforma.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Modo Mantenimiento</h4>
                  <p className="text-sm text-gray-500 mt-1">Deshabilita el acceso a la plataforma para todos los usuarios excepto Superadmins.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              <hr className="border-gray-100" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo de Soporte Global</label>
                <input type="email" defaultValue="soporte@aluna.com" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Plataforma</label>
                <input type="text" defaultValue="Aluna - Alto Andino QR Menu" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Apariencia</h3>
              <p className="text-sm text-gray-500 mb-4">Personaliza la tipografía y el estilo visual del panel SuperAdmin.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipografía Principal</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'inter', name: 'Inter', desc: 'Limpia y moderna' },
                    { id: 'outfit', name: 'Outfit', desc: 'Geométrica y amigable' },
                    { id: 'dm-sans', name: 'DM Sans', desc: 'Elegante y legible' }
                  ].map(font => (
                    <label 
                      key={font.id}
                      className={`relative flex flex-col p-4 border rounded-xl cursor-pointer hover:border-indigo-500 transition-all ${
                        typography === font.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="typography" 
                        value={font.id} 
                        checked={typography === font.id}
                        onChange={(e) => setTypography(e.target.value)}
                        className="sr-only" 
                      />
                      <span className="font-semibold text-gray-900" style={{ fontFamily: font.id === 'inter' ? 'Inter, sans-serif' : font.id === 'outfit' ? 'Outfit, sans-serif' : "'DM Sans', sans-serif" }}>
                        {font.name}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">{font.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Pasarelas de Pago</h3>
              <p className="text-sm text-gray-500 mb-4">Configura las credenciales para el cobro de suscripciones (SaaS).</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Modo Pruebas (Test Mode)</h4>
                  <p className="text-sm text-gray-500 mt-1">Utiliza las credenciales de prueba para todas las transacciones.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
              <hr className="border-gray-100" />
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Configuración Stripe</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                  <input type="text" placeholder="pk_test_..." className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                  <input type="password" placeholder="sk_test_..." className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
                  <input type="password" placeholder="whsec_..." className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Inteligencia Artificial</h3>
              <p className="text-sm text-gray-500 mb-4">Ajustes globales del Conserje Gastronómico con IA.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor de IA Global</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white">
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key Principal</label>
                <input type="password" placeholder="sk-..." className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
              <hr className="border-gray-100" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt Base</label>
                <textarea 
                  rows={4}
                  defaultValue="Eres Aluna, el Conserje Gastronómico experto. Ayudas a los comensales a elegir platillos basándote en el menú del restaurante. Siempre respondes con amabilidad y profesionalismo."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">Este prompt se concatena con el prompt específico de cada restaurante.</p>
              </div>
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Correos del Sistema</h3>
              <p className="text-sm text-gray-500 mb-4">Configuración SMTP para notificaciones transaccionales.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor SMTP (Host)</label>
                <input type="text" defaultValue="smtp.resend.com" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (Username)</label>
                  <input type="text" defaultValue="resend" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (Password/API Key)</label>
                  <input type="password" placeholder="re_..." className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
              </div>
              <hr className="border-gray-100" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remitente por defecto (From)</label>
                <input type="email" defaultValue="no-reply@aluna.com" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Seguridad y Límites</h3>
              <p className="text-sm text-gray-500 mb-4">Restricciones globales y acciones críticas.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite global de subida (Uploads)</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white">
                  <option value="2">2 MB</option>
                  <option value="5">5 MB</option>
                  <option value="10">10 MB</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">Aplica para imágenes de platillos y logos.</p>
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4 mt-6">
              <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle size={18} />
                Zona de Peligro
              </h4>
              <p className="text-sm text-red-600">Las siguientes acciones pueden interrumpir el servicio. Úsalas con precaución.</p>
              
              <div className="flex flex-wrap gap-4">
                <button className="px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-sm shadow-sm">
                  Cerrar todas las sesiones
                </button>
                <button className="px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-sm shadow-sm">
                  Limpiar Caché Global
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const tabsList = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'billing', label: 'Pasarelas de Pago', icon: CreditCard },
    { id: 'ai', label: 'IA y Conserje', icon: Sparkles },
    { id: 'email', label: 'Correos del Sistema', icon: Mail },
    { id: 'security', label: 'Seguridad y Límites', icon: Shield },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl text-[#1A1A1A] font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Configuración de Plataforma
          </h1>
          <p className="text-gray-500 mt-2">Gestiona las variables y ajustes globales del sistema.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-sm w-full sm:w-auto"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-800' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
}
