import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Switch, TextInput } from '../ui';

export function TelegramComandasCard({
  settingsForm,
  setSettingsForm,
  showTelegramGuide,
  setShowTelegramGuide,
  activeBrand,
  handleDetectChatId,
  isDetectingChatId,
  handleTestTelegram,
  isTestingTelegram,
  handleSaveSettings,
  isSubmittingSettings
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100/60">
            <Icon icon="logos:telegram" className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Comandas para Staff</h3>
              <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                Add-on Cocina
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Envía cada pedido confirmado automáticamente al grupo de Telegram de tu cocina y repartidores.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200/80 self-start sm:self-auto shrink-0">
          <span className="text-xs font-semibold text-gray-600">
            {settingsForm.telegram_enabled ? 'Activo' : 'Pausado'}
          </span>
          <Switch
            checked={settingsForm.telegram_enabled}
            onChange={(val) => setSettingsForm({ ...settingsForm, telegram_enabled: val })}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Botón Guía Rápida */}
        <div className="flex items-center justify-between bg-sky-50/60 border border-sky-200/70 rounded-xl p-3.5">
          <div className="flex items-center gap-2.5">
            <Icon icon="solar:lightbulb-bold" className="text-base text-sky-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-sky-950">¿Cómo conectar tu grupo en 3 pasos?</p>
              <p className="text-[11px] text-sky-700">Aprende a crear tu bot y obtener el ID de tu grupo de cocina.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTelegramGuide(!showTelegramGuide)}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 bg-white px-3 py-1.5 rounded-lg border border-sky-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Icon icon={showTelegramGuide ? "heroicons:chevron-up" : "heroicons:question-mark-circle"} className="text-sm" />
            <span>{showTelegramGuide ? 'Ocultar guía' : 'Ver guía'}</span>
          </button>
        </div>

        {/* Contenido de la Guía Paso a Paso */}
        <AnimatePresence>
          {showTelegramGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl border border-sky-200 p-5 space-y-4 text-xs text-gray-700 shadow-xs overflow-hidden"
            >
              {/* Paso 1 */}
              <div className="bg-sky-50/40 rounded-xl p-3.5 border border-sky-100 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">Crea tu Bot Oficial en Telegram (1 minuto)</h4>
                    <p className="text-[11px] text-gray-500">Llevará el nombre de tu restaurante para entregar las comandas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-white p-3 rounded-lg border border-sky-100 space-y-1">
                    <p className="font-semibold text-gray-800 text-[11px] flex items-center gap-1.5">
                      <span>a. Abre</span>
                      <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 underline font-bold">@BotFather</a>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Toca el link o búscalo en Telegram y escribe <code className="bg-sky-50 text-sky-800 font-mono font-semibold px-1 py-0.5 rounded border border-sky-200">/newbot</code>.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-sky-100 space-y-1">
                    <p className="font-semibold text-gray-800 text-[11px]">b. Escribe el Nombre del Bot</p>
                    <p className="text-[11px] text-gray-500">
                      Nombre público (ej: <span className="font-medium text-gray-700">Cocina {activeBrand?.name || 'Boku Bento'}</span>).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-sky-100 space-y-1 md:col-span-2">
                    <p className="font-semibold text-gray-800 text-[11px] flex items-center gap-1.5">
                      <span>c. Escribe el Usuario (Username)</span>
                      <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px]">Obligatorio</span>
                    </p>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Debe terminar estrictamente en <code className="bg-amber-50 text-amber-800 font-mono font-semibold px-1 py-0.5 rounded border border-amber-200">bot</code> o <code className="bg-amber-50 text-amber-800 font-mono font-semibold px-1 py-0.5 rounded border border-amber-200">_bot</code> (ej: <span className="font-mono font-semibold text-sky-800">{activeBrand?.slug ? `${activeBrand.slug.replace(/[^a-zA-Z0-9]/g, '')}bot` : 'BokuBentobot'}</span>).
                    </p>
                  </div>
                </div>

                <div className="bg-gray-900 text-gray-100 rounded-lg p-2.5 font-mono text-[10px] leading-relaxed">
                  <p className="text-gray-400 text-[9px] mb-1 border-b border-gray-800 pb-1">Token de BotFather:</p>
                  <p className="text-emerald-400 font-semibold">7123456789:AAGfuIeT-U78TBdup3hxyngmc...</p>
                  <p className="text-gray-400 text-[9px] mt-1">👆 Cópialo completo y pégalo abajo en <strong>"Token del Bot"</strong>.</p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="bg-sky-50/40 rounded-xl p-3.5 border border-sky-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">Crea tu Grupo y agrega al Bot</h4>
                    <p className="text-[11px] text-gray-500">Aquí llegará la comanda para el equipo.</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-sky-100 text-[11px] text-gray-600 space-y-1">
                  <p>• En Telegram, pulsa <strong>Nuevo Grupo</strong> (ej: <em>"Cocina - {activeBrand?.name || 'Mi Marca'}"</em>).</p>
                  <p>• Añade al personal y busca el bot que creaste para agregarlo al grupo.</p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="bg-sky-50/40 rounded-xl p-3.5 border border-sky-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">Pega tu Token y pulsa "Detectar ID Automáticamente"</h4>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-sky-100 text-[11px] text-gray-600 space-y-1.5">
                  <p>1. Pega el Token de BotFather en el campo de abajo.</p>
                  <p>2. Envía cualquier mensaje en tu grupo (ej: <code className="bg-sky-50 text-sky-800 font-mono font-semibold px-1 py-0.5 rounded border border-sky-200">hola</code>).</p>
                  <p>3. Pulsa <strong>"Detectar ID Automáticamente"</strong> y se llenará solo.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Banner */}
        <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
          settingsForm.telegram_enabled
            ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900'
            : 'bg-amber-50/70 border-amber-200/80 text-amber-900'
        }`}>
          <span className={`w-2 h-2 rounded-full ${settingsForm.telegram_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span>
            {settingsForm.telegram_enabled
              ? 'Conexión activa: los pedidos aprobados se despachan inmediatamente a Telegram.'
              : 'Add-on pausado: no se enviarán comandas a Telegram hasta que lo actives.'}
          </span>
        </div>

        {/* Inputs del Bot y Grupo */}
        <div className="bg-gray-50/60 p-5 rounded-xl border border-gray-200/80 space-y-4">
          {/* Campo 1: Token del Bot */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <span>1. Token del Bot de Telegram</span>
                <span className="text-[10px] text-gray-400 font-normal lowercase">(de @BotFather)</span>
              </label>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 underline"
              >
                Abrir @BotFather
              </a>
            </div>
            <TextInput
              value={settingsForm.telegram_bot_token || ''}
              onChange={(e) => {
                const val = e.target.value;
                setSettingsForm(prev => ({
                  ...prev,
                  telegram_bot_token: val,
                  telegram_enabled: prev.telegram_enabled || Boolean(val.trim())
                }));
              }}
              placeholder="Ej: 7123456789:AAFlkJg_v0fL9q2s9s..."
              className="font-mono text-xs"
            />
          </div>

          {/* Campo 2: Chat ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                <span>2. ID de Chat o Grupo de Cocina</span>
              </label>
              <button
                type="button"
                onClick={handleDetectChatId}
                disabled={isDetectingChatId || !settingsForm.telegram_bot_token}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  !settingsForm.telegram_bot_token || isDetectingChatId
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-2xs cursor-pointer'
                }`}
              >
                <Icon icon={isDetectingChatId ? "line-md:loading-loop" : "heroicons:sparkles"} className="text-xs" />
                <span>{isDetectingChatId ? 'Buscando...' : 'Detectar ID Automáticamente'}</span>
              </button>
            </div>
            <TextInput
              value={settingsForm.telegram_chat_id || ''}
              onChange={(e) => {
                const val = e.target.value;
                setSettingsForm(prev => ({
                  ...prev,
                  telegram_chat_id: val,
                  telegram_enabled: prev.telegram_enabled || Boolean(val.trim())
                }));
              }}
              placeholder="Ej: -10023481928"
              className="font-mono text-xs font-semibold"
            />
          </div>

          {/* Botón de Prueba */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200/70 text-[11px] text-gray-500">
            <p>Envía una comanda simulada para verificar la conexión.</p>

            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTestingTelegram || !settingsForm.telegram_chat_id}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !settingsForm.telegram_chat_id || isTestingTelegram
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-600 text-white shadow-2xs'
              }`}
            >
              {isTestingTelegram ? (
                <>
                  <Icon icon="line-md:loading-loop" className="text-sm" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Icon icon="heroicons:beaker" className="text-sm" />
                  <span>Probar Comanda</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSubmittingSettings}
            className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmittingSettings ? 'Guardando...' : 'Guardar Configuración Telegram'}
          </button>
        </div>
      </div>
    </div>
  );
}
