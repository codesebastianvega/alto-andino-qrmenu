import { FormField, TextInput } from '../ui';
import { Icon } from '@iconify-icon/react';

export default function FooterGreetingsCard({ data, setData }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/60">
          <Icon icon="solar:chat-round-line-bold-duotone" className="text-xl" />
        </div>
        <div>
          <h4 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Despedida & Saludos Dinámicos (Footer)</h4>
          <p className="text-xs text-gray-500 mt-0.5">Mensaje al final de la página según la hora del día</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="🌅 Mañana (5am - 12pm)" subtitle="Mensaje automático matutino">
          <TextInput
            value={data.footer_greeting_morning || ''}
            onChange={(e) => setData({ ...data, footer_greeting_morning: e.target.value })}
            placeholder="¡Que tengas una excelente mañana! ☀️"
          />
        </FormField>

        <FormField label="☀️ Tarde (12pm - 6pm)" subtitle="Mensaje automático de la tarde">
          <TextInput
            value={data.footer_greeting_afternoon || ''}
            onChange={(e) => setData({ ...data, footer_greeting_afternoon: e.target.value })}
            placeholder="¡Feliz tarde y buen provecho! 🍽️"
          />
        </FormField>

        <FormField label="🌙 Noche (6pm - 5am)" subtitle="Mensaje automático nocturno">
          <TextInput
            value={data.footer_greeting_night || ''}
            onChange={(e) => setData({ ...data, footer_greeting_night: e.target.value })}
            placeholder="Gracias por acompañarnos esta noche 🌙"
          />
        </FormField>
      </div>

      <div className="pt-2">
        <label className="text-xs font-bold text-gray-700 mb-1.5 block">
          Descripción de la Marca (Footer)
        </label>
        <textarea
          value={data.footer_tagline || ''}
          onChange={(e) => setData({ ...data, footer_tagline: e.target.value })}
          className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all placeholder:text-gray-400 min-h-[90px] shadow-2xs resize-none"
          placeholder="Ej. Elevando la experiencia de la comida saludable. Raíces locales, nutrición consciente y un espacio para respirar..."
        />
        <p className="text-[11px] text-gray-400 mt-1.5">Texto explicativo breve bajo el logo en el pie de página.</p>
      </div>
    </div>
  );
}
