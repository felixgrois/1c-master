
const playSynthSound = (type: 'SUCCESS' | 'FAILURE') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'SUCCESS') {
      // Мажорный аккорд или восходящий тон
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1); // A5
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    } else {
      // Диссонанс или нисходящий тон
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
      oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.2); // A2
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.warn("Synth sound failed:", e);
  }
};

export const playSound = async (text: string, type: 'SUCCESS' | 'FAILURE') => {
  // Мгновенный звук через синтезатор
  playSynthSound(type);
};

export const playSuccessSound = () => playSound("Ура! Правильно!", 'SUCCESS');
export const playFailureSound = () => playSound("Ой! Ошибка!", 'FAILURE');
