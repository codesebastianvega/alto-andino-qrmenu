/**
 * soundService.js - Servicio centralizado de sonidos de notificación para Aluna.
 * Utiliza Web Audio API con síntesis armónica rica (marimba/campana/chime),
 * desbloqueo automático de políticas de Autoplay del navegador y gestión de volumen/silencio.
 */

let audioCtx = null;
let soundEnabled = true;
let audioUnlocked = false;
let activeLoopInterval = null;

// Cargar preferencia guardada en localStorage
try {
  const savedSetting = localStorage.getItem('aluna_sound_enabled');
  if (savedSetting !== null) {
    soundEnabled = savedSetting === 'true';
  }
} catch (e) {
  console.warn('Unable to access localStorage for sound settings');
}

/**
 * Obtener o inicializar el AudioContext
 */

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Desbloquea el AudioContext en la primera interacción del usuario (click, touch, keydown)
 */
export const unlockAudio = () => {
  if (audioUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (ctx) {
      // Crear un buffer silencioso instantáneo para activar el audio en iOS/Safari/Chrome
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      if (ctx.state === 'running') {
        audioUnlocked = true;
      } else {
        ctx.resume().then(() => {
          audioUnlocked = true;
        });
      }
    }
  } catch (e) {
    console.error('Audio unlock failed:', e);
  }
};

// Listener global para desbloquear audio automáticamente
if (typeof window !== 'undefined') {
  const unlockEvents = ['pointerdown', 'click', 'keydown', 'touchstart'];
  const handleFirstInteraction = () => {
    unlockAudio();
    unlockEvents.forEach(evt => window.removeEventListener(evt, handleFirstInteraction));
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, handleFirstInteraction, { once: true }));
}

/**
 * Sintetizador genérico de tonos tipo campana armónica
 */
const playHarmonicChime = (notes, options = {}) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const { volume = 0.7, type = 'sine', repeat = 1 } = options;

  let currentRepeat = 0;

  const triggerChord = () => {
    const now = ctx.currentTime;

    notes.forEach(({ freq, delay = 0, duration = 0.6, gain = 0.5, octave2 = true }) => {
      const noteTime = now + delay;

      // Oscilador Principal
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, noteTime);

      // Envolvente de volumen (Ataque rápido, decaimiento suave estilo campana)
      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(gain * volume, noteTime + 0.02); // Ataque
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration); // Decaimiento

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration);

      // Armónico secundario (octava superior para resonancia rica estilo metálico)
      if (octave2) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2.005, noteTime); // Ligero detune para efecto coro

        gain2.gain.setValueAtTime(0, noteTime);
        gain2.gain.linearRampToValueAtTime(gain * volume * 0.3, noteTime + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.0001, noteTime + (duration * 0.7));

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(noteTime);
        osc2.stop(noteTime + duration);
      }
    });
  };

  triggerChord();

  if (repeat > 1) {
    const interval = setInterval(() => {
      currentRepeat++;
      if (currentRepeat < repeat) {
        triggerChord();
      } else {
        clearInterval(interval);
      }
    }, 450);
  }
};

/**
 * 🛎️ Nuevo Pedido (Cocina / Admin Orders)
 * Tono campana metálica de cocina potente (Doble strike resonante)
 */
export const playNewOrderSound = () => {
  playHarmonicChime([
    { freq: 523.25, delay: 0.0, duration: 0.8, gain: 0.8 },   // C5
    { freq: 659.25, delay: 0.0, duration: 0.8, gain: 0.6 },   // E5
    { freq: 783.99, delay: 0.0, duration: 0.9, gain: 0.7 },   // G5
    { freq: 1046.50, delay: 0.18, duration: 1.2, gain: 0.9 } // C6 (Golpe principal)
  ], { volume: 0.85, type: 'sine', repeat: 2 });
};

/**
 * 🎉 Pedido Listo (Cliente / OrderStatus / AdminKitchen)
 * Acorde ascendente festivo y alegre (C5 -> E5 -> G5 -> C6 marimba)
 */
export const playOrderReadySound = () => {
  playHarmonicChime([
    { freq: 523.25, delay: 0.0, duration: 0.4, gain: 0.6 },  // C5
    { freq: 659.25, delay: 0.1, duration: 0.4, gain: 0.7 },  // E5
    { freq: 783.99, delay: 0.2, duration: 0.5, gain: 0.8 },  // G5
    { freq: 1046.50, delay: 0.32, duration: 1.0, gain: 0.9 } // C6
  ], { volume: 0.8, type: 'sine' });
};

/**
 * 📥 Pedido Recibido / Enviado (Cliente)
 * Tono suave y reconfortante de confirmación (E5 -> B5 chime)
 */
export const playOrderReceivedSound = () => {
  playHarmonicChime([
    { freq: 659.25, delay: 0.0, duration: 0.5, gain: 0.5 },  // E5
    { freq: 987.77, delay: 0.12, duration: 0.7, gain: 0.7 }  // B5
  ], { volume: 0.65, type: 'sine' });
};

/**
 * ⚠️ Alerta de Pedido Retrasado / Urgente
 * Tono de advertencia staccato (A5 -> A5)
 */
export const playUrgentAlertSound = () => {
  playHarmonicChime([
    { freq: 880.00, delay: 0.0, duration: 0.25, gain: 0.8, octave2: false },
    { freq: 880.00, delay: 0.2, duration: 0.35, gain: 0.9, octave2: false }
  ], { volume: 0.8, type: 'sawtooth' });
};

/**
 * 💳 Cobro POS / Pago Registrado
 * Sonido de caja registradora metálico ("Ka-ching")
 */
export const playCashRegisterSound = () => {
  playHarmonicChime([
    { freq: 1318.51, delay: 0.0, duration: 0.15, gain: 0.6 }, // E6
    { freq: 1760.00, delay: 0.08, duration: 0.6, gain: 0.8 }  // A6
  ], { volume: 0.7, type: 'triangle' });
};

/**
 * Bucle de aviso persistente para nuevo pedido en cocina
 */
export const startNewOrderLoop = (intervalMs = 4000) => {
  stopNewOrderLoop();
  playNewOrderSound();
  activeLoopInterval = setInterval(() => {
    playNewOrderSound();
  }, intervalMs);
};

export const stopNewOrderLoop = () => {
  if (activeLoopInterval) {
    clearInterval(activeLoopInterval);
    activeLoopInterval = null;
  }
};

/**
 * Cambiar o consultar estado de sonido
 */
export const isSoundEnabled = () => soundEnabled;

export const setSoundEnabled = (enabled) => {
  soundEnabled = enabled;
  try {
    localStorage.setItem('aluna_sound_enabled', String(enabled));
  } catch (e) {
    console.warn('Failed to write sound settings to localStorage');
  }
};

export const toggleSound = () => {
  setSoundEnabled(!soundEnabled);
  if (soundEnabled) {
    playOrderReceivedSound(); // Tono de prueba al activar
  }
  return soundEnabled;
};

const soundService = {
  unlockAudio,
  playNewOrder: playNewOrderSound,
  playOrderReady: playOrderReadySound,
  playOrderReceived: playOrderReceivedSound,
  playUrgentAlert: playUrgentAlertSound,
  playCashRegister: playCashRegisterSound,
  startNewOrderLoop,
  stopNewOrderLoop,
  isSoundEnabled,
  setSoundEnabled,
  toggleSound
};

export default soundService;
