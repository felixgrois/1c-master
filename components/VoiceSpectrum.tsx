
import React, { useEffect, useRef, useState } from 'react';

interface VoiceSpectrumProps {
  isListening: boolean;
}

const VoiceSpectrum: React.FC<VoiceSpectrumProps> = ({ isListening }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [hasVoiceActivity, setHasVoiceActivity] = useState(false);

  useEffect(() => {
    if (isListening) {
      startAudio();
    } else {
      stopAudio();
      setHasVoiceActivity(false);
    }

    return () => {
      stopAudio();
    };
  }, [isListening]);

  const startAudio = async () => {
    if (localStorage.getItem('microphone_permission_confirmed') !== 'true') {
      return; // Do NOT request mic if not confirmed!
    }
    if (audioContextRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256; // Higher resolution for thin lines
      
      draw();
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      // We don't alert here to avoid multiple popups, 
      // but we log the error and ensure the UI reflects the state
      setHasVoiceActivity(false);
    }
  };

  const stopAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      audioContextRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyserRef.current!.getByteFrequencyData(dataArray);

      // Calculate average volume to detect voice activity
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Threshold for voice activity
      if (average > 10 && !hasVoiceActivity) {
        setHasVoiceActivity(true);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (average > 5) {
        if (!hasVoiceActivity && average > 15) {
          setHasVoiceActivity(true);
        }

        const barWidth = 1;
        const gap = 3;
        let x = 0;

        ctx.strokeStyle = '#0ea5e9'; // sky-500
        ctx.lineWidth = barWidth;
        ctx.lineCap = 'round';

        for (let i = 0; i < bufferLength; i++) {
          const value = dataArray[i];
          const percent = value / 255;
          const pulse = 0.8 + Math.sin(Date.now() / 150 + i * 0.1) * 0.2;
          const height = percent * canvas.height * pulse;

          const y1 = (canvas.height - height) / 2;
          const y2 = y1 + height;

          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.stroke();

          x += barWidth + gap;
          if (x > canvas.width) break;
        }
      } else {
        ctx.strokeStyle = '#e0f2fe'; // sky-100
        ctx.lineWidth = 1;
        ctx.beginPath();
        const y = canvas.height / 2;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    renderFrame();
  };

  if (!isListening) return null;

  return (
    <div className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-500 ${hasVoiceActivity ? 'bg-sky-50 border-sky-100' : 'bg-gray-50 border-gray-100'}`}>
      <canvas 
        ref={canvasRef} 
        width={120} 
        height={30} 
        className="rounded-lg"
      />
      <span className={`ml-3 text-[10px] font-black uppercase transition-all duration-500 ${hasVoiceActivity ? 'text-sky-600 animate-pulse' : 'text-gray-400'}`}>
        {hasVoiceActivity ? 'Запись...' : 'Ожидание голоса...'}
      </span>
    </div>
  );
};

export default VoiceSpectrum;
