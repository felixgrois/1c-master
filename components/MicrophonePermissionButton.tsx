
import React, { useState, useEffect } from 'react';
import { Mic, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface MicrophonePermissionButtonProps {
  onGranted?: () => void;
  className?: string;
  compact?: boolean;
}

const MicrophonePermissionButton: React.FC<MicrophonePermissionButtonProps> = ({ 
  onGranted, 
  className = "", 
  compact = false 
}) => {
  const [status, setStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking' | 'not-found'>('checking');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      // 1. Try standard query first
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as any });
        setStatus(result.state as any);

        result.onchange = () => {
          setStatus(result.state as any);
        };
        
        if (result.state === 'granted') return;
      }

      // 2. Fallback for Safari/other browsers: check enumerateDevices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasLabels = devices.some(device => device.kind === 'audioinput' && device.label !== '');
      
      if (hasLabels) {
        setStatus('granted');
      } else {
        setStatus('prompt');
      }
    } catch (err) {
      console.error("Error checking microphone permission:", err);
      setStatus('prompt');
    }
  };

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setStatus('granted');
      if (onGranted) onGranted();
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setStatus('not-found');
      } else if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setStatus('denied');
        console.warn("Microphone permission denied by user.");
      } else {
        setStatus('denied');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (status === 'granted') return null;

  if (compact) {
    return (
      <button
        onClick={requestPermission}
        disabled={isRequesting}
        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
          status === 'denied' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 
          status === 'not-found' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' :
          'bg-sky-100 text-sky-600 hover:bg-sky-200'
        } ${className}`}
        title={status === 'denied' ? "Доступ к микрофону запрещен. Нажмите, чтобы попробовать снова." : 
               status === 'not-found' ? "Микрофон не обнаружен. Подключите устройство и нажмите снова." :
               "Разрешить доступ к микрофону"}
      >
        {isRequesting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (status === 'denied' || status === 'not-found') ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-2xl border-2 transition-all ${
      status === 'denied' ? 'border-red-100 bg-red-50' : 
      status === 'not-found' ? 'border-orange-100 bg-orange-50' :
      'border-sky-100 bg-sky-50'
    } ${className}`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-xl ${status === 'denied' ? 'bg-red-100' : status === 'not-found' ? 'bg-orange-100' : 'bg-sky-100'}`}>
          {(status === 'denied' || status === 'not-found') ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : (
            <Mic className="w-5 h-5 text-sky-600" />
          )}
        </div>
        <div className="flex-grow">
          <h4 className={`text-[10px] font-black uppercase tracking-widest ${status === 'denied' ? 'text-red-800' : status === 'not-found' ? 'text-orange-800' : 'text-sky-800'}`}>
            {status === 'denied' ? 'Доступ к микрофону запрещен' : status === 'not-found' ? 'Микрофон не найден' : 'Требуется доступ к микрофону'}
          </h4>
          <p className="text-[9px] font-bold text-gray-500 leading-tight mt-0.5">
            {status === 'denied' 
              ? 'Доступ запрещен. Нажмите на иконку замочка в адресной строке (слева от URL) и переключите "Микрофон" в положение "Разрешить". Если Вы в режиме предпросмотра, используйте кнопку "Open in new tab" в углу экрана.' 
              : status === 'not-found'
              ? 'Убедитесь, что микрофон подключен и исправен.'
              : 'Для использования голосового ввода необходимо разрешение.'}
          </p>
        </div>
        <button
          onClick={requestPermission}
          disabled={isRequesting}
          className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all shadow-sm ${
            status === 'denied' 
              ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100' 
              : status === 'not-found'
              ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'
              : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-100'
          }`}
        >
          {isRequesting ? <Loader2 className="w-3 h-3 animate-spin" /> : status === 'not-found' ? 'Повторить' : 'Разрешить'}
        </button>
      </div>
    </div>
  );
};

export default MicrophonePermissionButton;
