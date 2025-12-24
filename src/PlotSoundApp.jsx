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
  Scissors,
  Construction,
  Music,
  Cog,
  Settings,
  Gauge,
  Plane,
  Bird,
  Dog,
  Cat,
  Rabbit
} from 'lucide-react';

export default function PlotSoundApp() {
  const [activeSounds, setActiveSounds] = useState({});
  const [masterVolume, setMasterVolume] = useState(0.5);
  const audioContextRef = useRef(null);

  // Mantiene referencia a los osciladores activos para poder detenerlos
  const activeNodesRef = useRef({});
  
  // Mantiene referencia a los archivos de audio HTML5
  const audioFilesRef = useRef({});

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
    // Detener archivos de audio HTML5
    if (audioFilesRef.current[id]) {
      const audio = audioFilesRef.current[id];
      audio.pause();
      audio.currentTime = 0;
      delete audioFilesRef.current[id];
      setActiveSounds(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      return;
    }

    // Detener sonidos sintetizados
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
    // Detener todos los archivos de audio
    Object.keys(audioFilesRef.current).forEach(id => stopSound(id));
    // Detener todos los sonidos sintetizados
    Object.keys(activeNodesRef.current).forEach(id => stopSound(id));
  };

  // --- MÓDULO DE SÍNTESIS DE SONIDO ---
  // Genera sonidos matemáticamente para funcionar 100% offline

  // Función para reproducir archivos de audio MP3
  const playAudioFile = (id, audioPath) => {
    // Si ya está sonando, lo paramos (toggle)
    if (activeSounds[id]) {
      stopSound(id);
      return;
    }

    setActiveSounds(prev => ({ ...prev, [id]: true }));

    const audio = new Audio(audioPath);
    audio.volume = masterVolume;
    audio.loop = true; // Repetir el audio
    
    audio.addEventListener('ended', () => {
      setActiveSounds(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      delete audioFilesRef.current[id];
    });

    audioFilesRef.current[id] = audio;
    audio.play().catch(e => {
      console.error('Error al reproducir audio:', e);
      setActiveSounds(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      delete audioFilesRef.current[id];
    });
  };

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
    gain.gain.value = 0.9;

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
    gain.gain.value = 0.9;

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

  // 16. Soldadora (Welder)
  const synthWelder = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 5;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;

    // Modulación rápida para simular el arco eléctrico
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 10;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.4;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    lfo.start();

    return { oscs: [noise, lfo], gainNode: gain };
  };

  // 17. Compresor de Aire
  const synthAirCompressor = (ctx, destination) => {
    const osc = ctx.createOscillator();
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    osc.type = 'sawtooth';
    osc.frequency.value = 60;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    const gain = ctx.createGain();
    gain.gain.value = 0.85;

    // Modulación para simular el ciclo del compresor
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2; // Ciclo cada 0.5 segundos
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc.start();
    noise.start();
    lfo.start();

    return { oscs: [osc, noise, lfo], gainNode: gain };
  };

  // 18. Excavadora
  const synthExcavator = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    osc1.type = 'sawtooth';
    osc1.frequency.value = 100;
    osc2.type = 'square';
    osc2.frequency.value = 150;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;

    // Modulación para simular el movimiento hidráulico
    const lfo = ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 0.8;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.25;

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

  // 19. Mezcladora de Concreto
  const synthConcreteMixer = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.value = 0.85;

    // Modulación para simular el tambor girando
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1.5; // Velocidad de rotación
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

  // 20. Sirena de Obra
  const synthConstructionSiren = (ctx, destination) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1);

    // LFO para el ciclo de la sirena
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3; // Más lento que sirena de policía
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    osc.connect(gain);
    gain.connect(destination);
    osc.start();

    return { oscs: [osc, lfo], gainNode: gain };
  };

  // 21. Helicóptero
  const synthHelicopter = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    // Múltiples osciladores para el efecto de rotor
    osc1.type = 'sawtooth';
    osc1.frequency.value = 150;
    osc2.type = 'sawtooth';
    osc2.frequency.value = 151.5; // Desafinado para efecto de palas
    osc3.type = 'sawtooth';
    osc3.frequency.value = 152; // Tercer oscilador para más realismo

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;

    // Modulación más rápida para simular las palas del rotor
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 8; // Velocidad del rotor principal
    const lfo1Gain = ctx.createGain();
    lfo1Gain.gain.value = 0.5;

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 16; // Rotor de cola más rápido
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.3;

    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(gain.gain);
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(gain.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    osc3.start();
    noise.start();
    lfo1.start();
    lfo2.start();

    return { oscs: [osc1, osc2, osc3, noise, lfo1, lfo2], gainNode: gain };
  };

  // 22. Avión
  const synthAirplane = (ctx, destination) => {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    // Dos osciladores para motor más realista
    osc1.type = 'sawtooth';
    osc1.frequency.value = 120;
    osc2.type = 'sawtooth';
    osc2.frequency.value = 180;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.9;

    // Modulación más compleja para simular el motor del avión
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 1.5;
    const lfo1Gain = ctx.createGain();
    lfo1Gain.gain.value = 0.4;

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 3;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.2;

    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(gain.gain);
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    noise.start();
    lfo1.start();
    lfo2.start();

    return { oscs: [osc1, osc2, noise, lfo1, lfo2], gainNode: gain };
  };

  // 23. Monos (Gritos de mono)
  const synthMonkey = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Frecuencias más agudas para sonido de mono
    osc1.type = 'sawtooth';
    osc1.frequency.value = 500;
    osc2.type = 'sawtooth';
    osc2.frequency.value = 550;

    // Modulación más rápida y variada
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200;

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // Filtro para hacerlo más nasal
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 3;

    gain.gain.value = 0;

    // Gritos intermitentes más cortos y agudos
    const loop = setInterval(() => {
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(500, now);
      osc2.frequency.setValueAtTime(550, now);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    }, 1500);

    // Primer grito
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    lfo.start();

    return { oscs: [osc1, osc2, lfo], gainNode: gain, interval: loop };
  };

  // 24. Perro (Ladrido)
  const synthDog = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Dos osciladores para sonido más rico
    osc1.type = 'sawtooth';
    osc1.frequency.value = 250;
    osc2.type = 'square';
    osc2.frequency.value = 300;

    // Modulación más realista
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 8;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 80;

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // Filtro para hacerlo más realista
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 2;

    gain.gain.value = 0;

    // Ladridos más realistas con variación
    const loop = setInterval(() => {
      const now = ctx.currentTime;
      const freq1 = 250 + Math.random() * 50;
      const freq2 = 300 + Math.random() * 50;
      osc1.frequency.setValueAtTime(freq1, now);
      osc2.frequency.setValueAtTime(freq2, now);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    }, 600 + Math.random() * 400);

    // Primer ladrido
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    lfo.start();

    return { oscs: [osc1, osc2, lfo], gainNode: gain, interval: loop };
  };

  // 25. Gato (Maullido)
  const synthCat = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Dos osciladores para sonido más rico
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(700, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.2);
    osc1.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.5);
    osc1.frequency.linearRampToValueAtTime(750, ctx.currentTime + 0.7);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.2);
    osc2.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5);
    osc2.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.7);

    // Filtro para sonido más nasal
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    // Maullidos intermitentes
    const loop = setInterval(() => {
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(700, now);
      osc1.frequency.linearRampToValueAtTime(1000, now + 0.2);
      osc1.frequency.linearRampToValueAtTime(600, now + 0.5);
      osc1.frequency.linearRampToValueAtTime(750, now + 0.7);
      osc2.frequency.setValueAtTime(900, now);
      osc2.frequency.linearRampToValueAtTime(1200, now + 0.2);
      osc2.frequency.linearRampToValueAtTime(800, now + 0.5);
      osc2.frequency.linearRampToValueAtTime(950, now + 0.7);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.9, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    }, 2500);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();

    return { oscs: [osc1, osc2], gainNode: gain, interval: loop };
  };

  // 26. Pájaro (Canto)
  const synthBird = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 1500;
    osc2.type = 'sine';
    osc2.frequency.value = 1800;

    // Modulación más melódica para el canto
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 4;
    const lfo1Gain = ctx.createGain();
    lfo1Gain.gain.value = 300;

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 2;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 0.3;

    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(osc1.frequency);
    lfo1Gain.connect(osc2.frequency);

    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(gain.gain);

    // Filtro para sonido más agudo y claro
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;

    gain.gain.value = 0.8;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();
    lfo1.start();
    lfo2.start();

    return { oscs: [osc1, osc2, lfo1, lfo2], gainNode: gain };
  };

  // 27. Vaca (Mugido)
  const synthCow = (ctx, destination) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Dos osciladores para sonido más grave y rico
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(120, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.6);
    osc1.frequency.linearRampToValueAtTime(130, ctx.currentTime + 1.2);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(180, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.6);
    osc2.frequency.linearRampToValueAtTime(195, ctx.currentTime + 1.2);

    // Filtro para sonido más grave y nasal
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    // Mugidos intermitentes
    const loop = setInterval(() => {
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(120, now);
      osc1.frequency.linearRampToValueAtTime(100, now + 0.6);
      osc1.frequency.linearRampToValueAtTime(130, now + 1.2);
      osc2.frequency.setValueAtTime(180, now);
      osc2.frequency.linearRampToValueAtTime(150, now + 0.6);
      osc2.frequency.linearRampToValueAtTime(195, now + 1.2);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.9, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    }, 3500);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    osc1.start();
    osc2.start();

    return { oscs: [osc1, osc2], gainNode: gain, interval: loop };
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
    { id: 'saw', label: 'Sierra', icon: Scissors, color: 'text-red-500', bg: 'bg-red-600/20', border: 'border-red-600', fn: synthSaw },
    { id: 'hammer', label: 'Golpe', icon: Hammer, color: 'text-yellow-600', bg: 'bg-yellow-600/20', border: 'border-yellow-600', fn: synthHammerHit },
    { id: 'machinery', label: 'Maquinaria', icon: Construction, color: 'text-orange-500', bg: 'bg-orange-700/20', border: 'border-orange-700', fn: synthHeavyMachinery },
    { id: 'welder', label: 'Soldadora', icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-600/20', border: 'border-cyan-600', fn: synthWelder },
    { id: 'compressor', label: 'Compresor', icon: Gauge, color: 'text-slate-400', bg: 'bg-slate-600/20', border: 'border-slate-600', fn: synthAirCompressor },
    { id: 'excavator', label: 'Excavadora', icon: Construction, color: 'text-amber-600', bg: 'bg-amber-700/20', border: 'border-amber-700', fn: synthExcavator },
    { id: 'mixer', label: 'Mezcladora', icon: Cog, color: 'text-gray-500', bg: 'bg-gray-600/20', border: 'border-gray-600', fn: synthConcreteMixer },
    { id: 'consiren', label: 'Sirena Obra', icon: Siren, color: 'text-orange-400', bg: 'bg-orange-600/20', border: 'border-orange-600', fn: synthConstructionSiren },
    { id: 'helicopter', label: 'Helicóptero', icon: Plane, color: 'text-sky-400', bg: 'bg-sky-600/20', border: 'border-sky-600', fn: synthHelicopter },
    { id: 'airplane', label: 'Avión', icon: Plane, color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500', fn: synthAirplane },
    { id: 'monkey', label: 'Mono', icon: Rabbit, color: 'text-amber-500', bg: 'bg-amber-700/20', border: 'border-amber-700', fn: synthMonkey },
    { id: 'dog', label: 'Perro', icon: Dog, color: 'text-yellow-700', bg: 'bg-yellow-800/20', border: 'border-yellow-800', fn: synthDog },
    { id: 'cat', label: 'Gato', icon: Cat, color: 'text-orange-400', bg: 'bg-orange-600/20', border: 'border-orange-600', fn: synthCat },
    { id: 'bird', label: 'Pájaro', icon: Bird, color: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500', fn: synthBird },
    { id: 'cow', label: 'Vaca', icon: Rabbit, color: 'text-stone-300', bg: 'bg-stone-600/20', border: 'border-stone-600', fn: synthCow },
    { id: 'kulikitaka', label: 'Kulikitaka', icon: Music, color: 'text-pink-400', bg: 'bg-pink-600/20', border: 'border-pink-600', audioFile: '/kulikitaka.mp3' },
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
                const newVolume = parseFloat(e.target.value);
                setMasterVolume(newVolume);
                // Actualizar volumen de archivos de audio en tiempo real
                Object.values(audioFilesRef.current).forEach(audio => {
                  audio.volume = newVolume;
                });
                // Actualizar volumen en tiempo real si hay nodos activos
                if (audioContextRef.current) {
                  // Esto solo afecta a nuevos sonidos sintetizados en esta implementación simple, 
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
                onClick={() => {
                  if (sound.audioFile) {
                    playAudioFile(sound.id, sound.audioFile);
                  } else if (sound.fn) {
                    playTone(sound.id, sound.fn);
                  }
                }}
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
