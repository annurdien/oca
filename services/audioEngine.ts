
// Tactical Audio Engine using Web Audio API
// Generates sci-fi UI sounds and ambient music procedurally

let audioCtx: AudioContext | null = null;
let isMuted = false;
let musicNodes: AudioScheduledSourceNode[] = [];
let musicGain: GainNode | null = null;

// Initialize Audio Context (must be called after user interaction)
export const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
};

export const startMusic = () => {
    if (isMuted || musicNodes.length > 0) return; // Already playing or muted
    const ctx = initAudio();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0; // Start silent for fade-in
    masterGain.connect(ctx.destination);
    musicGain = masterGain;

    // Create a Sci-Fi Drone (A Minor Add 9 cluster)
    // Low frequencies for "Space" feel
    const freqs = [55, 110.00, 130.81, 164.81, 196.00]; // A1, A2, C3, E3, G3
    
    freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            
            // Slight detune for warmth
            osc.frequency.value = f + (Math.random() * 0.5 - 0.25); 
            
            const oscGain = ctx.createGain();
            // Lower volume for higher pitch
            oscGain.gain.value = 0.02 - (i * 0.002); 
            
            // Add subtle LFO for movement
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1 + (Math.random() * 0.1);
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.005;
            lfo.connect(lfoGain);
            lfoGain.connect(oscGain.gain);
            lfo.start();
            musicNodes.push(lfo);

            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start();
            musicNodes.push(osc);
    });

    // Fade in
    masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 4);
};

export const stopMusic = () => {
    if (musicGain && audioCtx) {
        // Fade out
        musicGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        
        setTimeout(() => {
            musicNodes.forEach(n => {
                try { n.stop(); } catch(e) {}
            });
            musicNodes = [];
            if (musicGain) {
                musicGain.disconnect();
                musicGain = null;
            }
        }, 1000);
    }
};

export const toggleMute = () => {
    isMuted = !isMuted;
    if (isMuted) {
        stopMusic();
    } else {
        startMusic();
    }
    return isMuted;
};

export const getMuteState = () => isMuted;

// 1. Standard UI Click (Mechanical/Tactical)
export const playClick = () => {
  if (isMuted) return;
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'square';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.01, ctx.currentTime); // Reduced volume
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

// 2. Hover (High Tech Chirp)
export const playHover = () => {
  if (isMuted) return;
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.01);

  gain.gain.setValueAtTime(0.001, ctx.currentTime); // Significantly reduced volume
  gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.01);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.01);
};

// 3. Open/Scan (Swoosh)
export const playScan = () => {
  if (isMuted) return;
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

// 4. Success/Notification (Chime)
export const playSuccess = () => {
   if (isMuted) return;
   const ctx = initAudio();
   if (!ctx) return;

   // Arpeggio
   [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
       const osc = ctx.createOscillator();
       const gain = ctx.createGain();
       const t = ctx.currentTime + i * 0.08;
       
       osc.type = 'triangle';
       osc.frequency.setValueAtTime(freq, t);
       
       gain.gain.setValueAtTime(0.03, t);
       gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
       
       osc.connect(gain);
       gain.connect(ctx.destination);
       osc.start(t);
       osc.stop(t + 0.4);
   });
};

// 5. Error/Deny (Low Buzz)
export const playError = () => {
  if (isMuted) return;
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
};