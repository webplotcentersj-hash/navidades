import React, { useState, useEffect, useRef } from 'react';
import {
  Siren,
  Megaphone,
  AlertTriangle,
  Bell,
  Volume2,
  Square,
  Activity,
  Truck,
  Zap,
  Radio,
  Hammer,
  VolumeX,
  Wrench,
  Saw,
  Construction,
  Music
} from 'lucide-react';

export default function PlotSoundApp() {
  const [activeSounds, setActiveSounds] = useState({});
  const [masterVolume, setMasterVolume] = useState(0.5);
  const audioContextRef = useRef(null);

  // Mantiene referencia a los osciladores activos para poder detenerlos
  const activeNodesRef = useRef({});

  // Inicializar el contexto de audio con interacción del usuario
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const stopSound = (id) => {
    if (activeNodesRef.current[id]) {
      const { oscs, gainNode, interval } = activeNodesRef.current[id];

      // Ramp down volume to avoid clicking
      try {
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
      } catch (e) { }

      setTimeout(() => {
        oscs.forEach(node => {
          try { node.stop(); node.disconnect(); } catch (e) { }
        });
        if (gainNode) gainNode.disconnect();
        if (interval) clearInterval(interval);
      }, 100);

      delete activeNodesRef.current[id];
      setActiveSounds(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const stopAll = () => {
    Object.keys(activeNodesRef.current).forEach(id => stopSound(id));
  };

  // --- MÓDULO DE SÍNTESIS DE SONIDO ---
  // Genera sonidos matemáticamente para funcionar 100% offline

  const playTone = (id, generatorFn) => {
    initAudio();
    const ctx = audioContextRef.current;

    // Si ya está sonando, lo paramos (toggle)
    if (activeSounds[id]) {
      stopSound(id);
      return;
    }

    setActiveSounds(prev => ({ ...prev, [id]: true }));

    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(ctx.destination);

    // Ejecutar la función generadora específica
    const nodes = generatorFn(ctx, masterGain);

    activeNodesRef.current[id] = nodes; // Guardar referencia para detener después

    // Auto-stop si es un efecto corto (one-shot)
    if (nodes.duration) {
      setTimeout(() => {
        stopSound(id);
      }, nodes.duration * 1000);
    }
  };

  // 1. Sirena de Policía (Wail)
  const synthSiren = (ctx, destination) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 1.5);

    // LFO para el ciclo de la sirena
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // Velocidad del ciclo
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400; // Rango de frecuencia

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    osc.connect(gain);
    gain.connect(destination);
    osc.start();

    return { oscs: [osc, lfo], gainNode: gain };
  };

  // 2. Alarma Nuclear / Ataque Aéreo
  const synthAirRaid = (ctx, destination) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 2);

    // Bucle manual para el efecto de subida lenta
    const loop = setInterval(() => {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 2);
    }, 2500);

    osc.connect(gain);
    gain.connect(destination);
    osc.start();

    return { oscs: [osc], gainNode: gain, interval: loop };
  };

  // 3. Bocina de Auto Urbana
  const synthCarHorn = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    // Dos tonos disonantes crean el efecto de bocina
    osc1.frequency.value = 400;
    osc2.frequency.value = 500; // Intervalo de tercera mayor aprox

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);

    osc1.start();
    osc2.start();

    return { oscs: [osc1, osc2], gainNode: gain };
  };

  // 4. Bocina de Camión (Grave)
  const synthTruckHorn = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'sawtooth';

    osc1.frequency.value = 150;
    osc2.frequency.value = 155; // Desafinación ligera

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();

    return { oscs: [osc1, osc2], gainNode: gain };
  };

  // 5. Alarma de Retroceso (Beep Beep)
  const synthBackupBeep = (ctx, destination) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 1200;

    // Gating para hacer el beep-beep
    gain.gain.setValueAtTime(0, ctx.currentTime);

    const loop = setInterval(() => {
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
    }, 600);

    osc.connect(gain);
    gain.connect(destination);
    osc.start();

    return { oscs: [osc], gainNode: gain, interval: loop };
  };

  // 6. Ruido Blanco (Estática/Radio)
  const createNoiseBuffer = (ctx) => {
    const bufferSize = ctx.sampleRate * 2; // 2 segundos
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const synthStatic = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    noise.connect(filter);
    filter.connect(destination);
    noise.start();

    return { oscs: [noise], gainNode: null }; // Gain ya está en destination
  };

  // 7. Martillo Neumático (Obra en construcción)
  const synthJackhammer = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    // Ritmo rápido
    const loop = setInterval(() => {
      // Golpe seco
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    }, 100);

    noise.connect(gain);
    gain.connect(destination);
    noise.start();

    return { oscs: [noise], gainNode: gain, interval: loop };
  };

  // 8. Tono de Alarma Robo (Agudo y rápido)
  const synthBurglar = (ctx, destination) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1500, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 6; // Muy rápido

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    osc.connect(gain);
    gain.connect(destination);
    osc.start();

    return { oscs: [osc, lfo], gainNode: gain };
  };

  // 9. Laser / Sci-Fi (One Shot)
  const synthLaser = (ctx, destination) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(destination);
    osc.start();

    return { oscs: [osc], gainNode: gain, duration: 0.3 };
  };

  // 10. Jingle Bells (Campanitas Navideñas)
  const synthJingleBells = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Tres tonos diferentes para simular cascabeles
    osc1.type = 'sine';
    osc1.frequency.value = 800;
    osc2.type = 'sine';
    osc2.frequency.value = 1000;
    osc3.type = 'sine';
    osc3.frequency.value = 1200;

    // Modulación rápida para el efecto de cascabel
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 8; // Vibración rápida
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    lfoGain.connect(osc3.frequency);

    // Gating para el ritmo de cascabeles
    gain.gain.setValueAtTime(0, ctx.currentTime);
    const loop = setInterval(() => {
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.1);
    }, 200);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    return { oscs: [osc1, osc2, osc3, lfo], gainNode: gain, interval: loop };
  };

  // 11. Campanas (Church Bells)
  const synthBells = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Frecuencias armónicas para sonido de campana
    osc1.type = 'sine';
    osc1.frequency.value = 523.25; // Do5
    osc2.type = 'sine';
    osc2.frequency.value = 659.25; // Mi5
    osc3.type = 'sine';
    osc3.frequency.value = 783.99; // Sol5

    // Envolvente de campana (ataque rápido, decay lento)
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    osc3.start();

    // Repetir cada 3 segundos
    const loop = setInterval(() => {
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
    }, 3000);

    return { oscs: [osc1, osc2, osc3], gainNode: gain, interval: loop };
  };

  // 12. Taladro Eléctrico
  const synthDrill = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    // Modulación de frecuencia para simular el taladro
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5; // Velocidad del taladro
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Variación de volumen
    const volumeLoop = setInterval(() => {
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    }, 150);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    lfo.start();

    return { oscs: [noise, lfo], gainNode: gain, interval: volumeLoop };
  };

  // 13. Sierra Circular
  const synthSaw = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.value = 0.7;

    // Modulación para simular el movimiento de la sierra
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.value = 3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    lfo.start();

    return { oscs: [noise, lfo], gainNode: gain };
  };

  // 14. Martillo Golpeando
  const synthHammerHit = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    // Repetir golpes cada 0.8 segundos
    const loop = setInterval(() => {
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    }, 800);

    // Primer golpe inmediato
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();

    return { oscs: [noise], gainNode: gain, interval: loop };
  };

  // 15. Retroexcavadora / Maquinaria Pesada
  const synthHeavyMachinery = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    osc1.type = 'sawtooth';
    osc1.frequency.value = 80;
    osc2.type = 'square';
    osc2.frequency.value = 120;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    // Modulación lenta para simular el motor
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    noise.start();
    lfo.start();

    return { oscs: [osc1, osc2, noise, lfo], gainNode: gain };
  };

  // DATA DE LOS BOTONES
  const soundBank = [
    { id: 'police', label: 'Policía', icon: Siren, color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500', fn: synthSiren },
    { id: 'horn', label: 'Bocina', icon: Megaphone, color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500', fn: synthCarHorn },
    { id: 'truck', label: 'Camión', icon: Truck, color: 'text-orange-600', bg: 'bg-orange-600/20', border: 'border-orange-600', fn: synthTruckHorn },
    { id: 'airraid', label: 'Aérea', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-600/20', border: 'border-red-600', fn: synthAirRaid },
    { id: 'backup', label: 'Retroceso', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500', fn: synthBackupBeep },
    { id: 'jackhammer', label: 'Martillo', icon: Hammer, color: 'text-stone-400', bg: 'bg-stone-500/20', border: 'border-stone-500', fn: synthJackhammer },
    { id: 'burglar', label: 'Robo', icon: Bell, color: 'text-red-400', bg: 'bg-red-400/20', border: 'border-red-400', fn: synthBurglar },
    { id: 'static', label: 'Estática', icon: Radio, color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-400', fn: synthStatic },
    { id: 'laser', label: 'Láser', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500', fn: synthLaser },
    { id: 'jingle', label: 'Cascabel', icon: Music, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500', fn: synthJingleBells },
    { id: 'bells', label: 'Campanas', icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500', fn: synthBells },
    { id: 'drill', label: 'Taladro', icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-600/20', border: 'border-blue-600', fn: synthDrill },
    { id: 'saw', label: 'Sierra', icon: Saw, color: 'text-red-500', bg: 'bg-red-600/20', border: 'border-red-600', fn: synthSaw },
    { id: 'hammer', label: 'Golpe', icon: Hammer, color: 'text-yellow-600', bg: 'bg-yellow-600/20', border: 'border-yellow-600', fn: synthHammerHit },
    { id: 'machinery', label: 'Maquinaria', icon: Construction, color: 'text-orange-500', bg: 'bg-orange-700/20', border: 'border-orange-700', fn: synthHeavyMachinery },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-rose-500 selection:text-white pb-10">
      {/* Header */}
      <div className="bg-neutral-800 border-b border-neutral-700 p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
            <h1 className="text-2xl font-black tracking-tighter italic bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
              PLot SOUND
            </h1>
          </div>
          <div className="text-xs text-neutral-400 font-mono border border-neutral-600 px-2 py-0.5 rounded">
            OFFLINE V1.0
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">

        {/* Controles Maestros */}
        <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <Volume2 size={20} className="text-neutral-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => {
                setMasterVolume(parseFloat(e.target.value));
                // Actualizar volumen en tiempo real si hay nodos activos
                if (audioContextRef.current) {
                  // Esto solo afecta a nuevos sonidos en esta implementación simple, 
                  // pero es suficiente para una botonera rápida.
                }
              }}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
          <button
            onClick={stopAll}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-3 rounded-lg font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <Square size={18} fill="currentColor" />
            DETENER TODO
          </button>
        </div>

        {/* Grid de Botones */}
        <div className="grid grid-cols-3 gap-3">
          {soundBank.map((sound) => {
            const isActive = activeSounds[sound.id];
            const Icon = sound.icon;

            return (
              <button
                key={sound.id}
                onClick={() => playTone(sound.id, sound.fn)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all duration-100 touch-manipulation
                  ${isActive
                    ? `${sound.bg} ${sound.border} translate-y-1 shadow-[0_0_20px_rgba(0,0,0,0.3)]`
                    : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-750'
                  }
                `}
              >
                {/* Indicador de Activo */}
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-ping"></span>
                )}

                <Icon
                  size={32}
                  className={`transition-colors duration-200 ${isActive ? sound.color : 'text-neutral-400'}`}
                />

                <span className={`text-xs font-bold uppercase tracking-wide ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                  {sound.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="text-center text-neutral-600 text-xs font-mono py-4">
          <p>SINTETIZADOR URBANO // NO REQUIERE INTERNET</p>
          <p className="mt-1 opacity-50">Toca para activar / Toca de nuevo para parar</p>
        </div>
      </div>

      <style>{`
        /* Estilos para el rango slider */
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          margin-top: -4px;
        }
      `}</style>
    </div >
  );
}
