
export const processHtmlContent = (html: string) => {
  if (!html) return '';
  // Ensure all links open in a new tab
  return html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, (match, href, rest) => {
    if (rest.includes('target="_blank"')) return match;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${rest}>`;
  });
};

/**
 * Преобразует сырые PCM данные (base64) в WAV формат (Blob URL)
 */
export const pcmToWav = (base64Pcm: string, sampleRate: number = 24000): string => {
  if (!base64Pcm || typeof base64Pcm !== 'string') {
    console.error("Invalid base64 string provided to pcmToWav");
    return '';
  }

  try {
    // Чистим строку от возможных пробелов и лишних символов
    const cleanBase64 = base64Pcm.trim().replace(/\s/g, '');
    
    // Проверяем, не содержит ли строка символы вне диапазона Latin1 перед atob
    // Если содержит - это не валидный base64 для аудио данных
    for (let i = 0; i < cleanBase64.length; i++) {
      if (cleanBase64.charCodeAt(i) > 255) {
        throw new Error("Base64 string contains non-Latin1 characters");
      }
    }

    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    // file length
    view.setUint32(4, 36 + len, true);
    // RIFF type
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // format chunk identifier
    view.setUint32(12, 0x666d7420, false); // "fmt "
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw PCM = 1)
    view.setUint16(20, 1, true);
    // channel count (mono = 1)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    view.setUint32(36, 0x64617461, false); // "data"
    // data chunk length
    view.setUint32(40, len, true);

    const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error in pcmToWav:", error);
    return '';
  }
};

/**
 * Озвучивает текст с помощью встроенного в браузер синтезатора речи (Fallback)
 */
export const browserSpeak = (text: string): void => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Останавливаем текущую озвучку
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Пытаемся найти мужской голос, если доступно
  const voices = window.speechSynthesis.getVoices();
  const maleVoice = voices.find(v => v.lang.startsWith('ru') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('dmitry') || v.name.toLowerCase().includes('pavel')));
  if (maleVoice) {
    utterance.voice = maleVoice;
  }

  window.speechSynthesis.speak(utterance);
};
