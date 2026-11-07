import { Send } from 'lucide-react';

export default function AlunaInputBar({
  titleId,
  prompt,
  setPrompt,
  promptRef,
  isLoading,
  audit,
  executeAudit,
  handleSubmit,
  handlePromptKeyDown,
}) {
  return (
    <footer className="border-t border-gray-200 bg-white p-4 sm:px-6">
      {audit ? (
        <button
          type="button"
          onClick={executeAudit}
          disabled={isLoading}
          className="mb-3 w-full rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isLoading ? 'Actualizando auditoría…' : 'Volver a auditar'}
        </button>
      ) : null}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <label htmlFor={`${titleId}-prompt`} className="sr-only">
          Escribe a Aluna
        </label>
        <textarea
          ref={promptRef}
          id={`${titleId}-prompt`}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handlePromptKeyDown}
          placeholder="Pídele algo a Aluna (ej: Crea el plato Limonada de Coco a $14.000, o ajusta el costo de domicilio a $6.000)…"
          rows={1}
          className="max-h-48 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#173D24] text-white hover:bg-[#21542f] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Enviar mensaje"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </form>
      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-gray-400">
        <span>Enter para enviar · Shift + Enter para una nueva línea</span>
        <span>{prompt.length.toLocaleString('es-CO')} caracteres</span>
      </div>
    </footer>
  );
}
