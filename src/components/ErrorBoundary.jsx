import React from "react";
import { RefreshCw, Trash2, Copy, Check, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { safeStorage as localStorage, safeSessionStorage as sessionStorage } from "../utils/safeStorage";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      copied: false,
      showDetails: false,
      isAutoReloading: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });

    // --- AUTO-HEALING CHECK ---
    // Detect ChunkLoadErrors or failed dynamic imports commonly caused by a new deploy deleting old chunks.
    const errorStr = (error?.message || "") + " " + (error?.stack || "");
    const isChunkError = 
      error?.name === "ChunkLoadError" ||
      /chunk|loading|dynamically imported|import|failed to fetch/i.test(errorStr);

    if (isChunkError) {
      try {
        const reloadCountStr = sessionStorage.getItem("aa_chunk_reload_count") || "0";
        const reloadCount = parseInt(reloadCountStr, 10);
        
        if (reloadCount < 1) {
          // Record the auto-reload to avoid an infinite refresh loop
          sessionStorage.setItem("aa_chunk_reload_count", String(reloadCount + 1));
          this.setState({ isAutoReloading: true });
          
          console.warn("ErrorBoundary: ChunkLoadError detected. Attempting automatic clean reload...");
          
          // Small delay before reload for smooth visual feedback
          setTimeout(() => {
            window.location.reload(true);
          }, 800);
          return;
        }
      } catch (e) {
        console.error("ErrorBoundary safe reload storage check failed", e);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    // Reset chunk reload counter if they manually retry
    try {
      sessionStorage.removeItem("aa_chunk_reload_count");
    } catch {}
    if (typeof this.props.onRetry === "function") {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  handleWipeAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error("ErrorBoundary failed to clear storage:", e);
    }
    // Force bypass-cache reload
    window.location.reload(true);
  };

  handleCopyDetails = () => {
    const errorDetails = `
=== ALUNA ERROR REPORT ===
URL: ${window.location.href}
UserAgent: ${navigator.userAgent}
Time: ${new Date().toISOString()}
Error: ${this.state.error?.name || "UnknownError"}: ${this.state.error?.message || "No message available"}
Stack:
${this.state.error?.stack || "No stack trace available"}
Component Stack:
${this.state.errorInfo?.componentStack || "No component stack trace available"}
==========================
    `.trim();

    try {
      navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    } catch (e) {
      console.error("Failed to copy error details to clipboard:", e);
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev }));
  };

  render() {
    if (this.state.hasError) {
      // Custom self-healing loading view
      if (this.state.isAutoReloading) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 animate-spin mb-6">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Actualizando versión
            </h1>
            <p className="text-gray-600 max-w-md">
              Hemos detectado una nueva actualización disponible en la plataforma. Recargando la aplicación para aplicar los cambios...
            </p>
          </div>
        );
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] p-4 sm:p-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-100 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Algo no salió como esperábamos
              </h1>
              <p className="text-sm text-gray-500 max-w-md">
                La aplicación experimentó un fallo imprevisto. Puedes intentar solucionarlo recargando o limpiando la sesión.
              </p>
            </div>

            {/* Error Message Snippet */}
            <div className="mb-6 rounded-xl bg-red-50/50 border border-red-100 p-4 text-left">
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">
                Detalle del fallo:
              </p>
              <p className="text-sm font-medium text-red-900 break-words">
                {this.state.error?.message || "Error desconocido"}
              </p>
            </div>

            {/* Giant Primary Wiping / Reload Action */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={this.handleWipeAndReload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-red-700 active:scale-[0.98] transition-all shadow-md shadow-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpiar Caché y Recargar
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all focus:outline-none"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </button>

                <button
                  type="button"
                  onClick={this.handleCopyDetails}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all focus:outline-none"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar Informe</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Technical Accordion Toggle */}
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="flex w-full items-center justify-between py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors"
              >
                <span>Información Técnica Avanzada</span>
                {this.state.showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="max-h-60 overflow-y-auto text-left font-mono text-[10px] leading-relaxed text-gray-700">
                    <p className="font-bold text-gray-900 border-b border-gray-200 pb-1 mb-2">
                      Stack Trace:
                    </p>
                    <pre className="whitespace-pre-wrap break-all">
                      {this.state.error?.stack || "No stack trace available"}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <p className="font-bold text-gray-900 border-b border-gray-200 pb-1 mt-3 mb-2">
                          React Component Stack:
                        </p>
                        <pre className="whitespace-pre-wrap break-all">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;