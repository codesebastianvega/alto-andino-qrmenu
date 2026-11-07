import { ChevronRight } from 'lucide-react';
import { STATUS_STYLES } from '../helpers/copilotHelpers';

export default function AuditResult({ audit, onResolve }) {
  const findings = Array.isArray(audit?.findings) ? audit.findings : [];
  const score = Number.isFinite(audit?.score) ? audit.score : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#14261A] p-5 text-white shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Preparación del local
            </p>
            <p className="mt-2 text-4xl font-bold">
              {score}
              <span className="text-lg text-white/60">/100</span>
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            {audit?.readiness === 'ready' ? 'Listo para operar' : 'Revisión necesaria'}
          </span>
        </div>
        {audit?.summary ? (
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            {audit.summary.ready || 0} listos · {audit.summary.warnings || 0} por mejorar ·{' '}
            {audit.summary.blockers || 0} bloqueantes
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {findings.map((finding, index) => {
          const status = STATUS_STYLES[finding.status] || STATUS_STYLES.warning;
          const StatusIcon = status.icon;
          return (
            <article
              key={finding.key || `${finding.label}-${index}`}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full border p-1.5 ${status.className}`}>
                  <StatusIcon size={15} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">
                      {finding.label || finding.title}
                    </h4>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{finding.message}</p>
                  {finding.status !== 'ready' && finding.suggested_action ? (
                    <div className="mt-3 flex items-start gap-1.5 text-xs font-medium text-[#315C3A]">
                      <ChevronRight size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{finding.suggested_action}</span>
                    </div>
                  ) : null}
                  {finding.status !== 'ready' ? (
                    <button
                      type="button"
                      onClick={() => onResolve(finding)}
                      className="mt-3 rounded-xl bg-[#173D24] px-4 py-2 text-xs font-bold text-white hover:bg-[#21542f]"
                    >
                      {['locations', 'catalog', 'business_hours', 'payment_methods', 'printing', 'modifiers'].includes(
                        finding.key
                      )
                        ? 'Resolver con Aluna'
                        : 'Abrir para resolver'}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
