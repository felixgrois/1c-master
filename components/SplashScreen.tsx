import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { OneCLogo } from '../constants';

interface SplashScreenProps {
  loadingText?: string;
  showOverlay?: boolean;
  onFinished?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  loadingText = "",
  showOverlay = true,
  onFinished
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSpoken = useRef(false);
  const onFinishedRef = useRef(onFinished);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    let isMounted = true;
    const video = videoRef.current;

    if (video) {
      // Ensure video doesn't loop and stays on last frame
      video.loop = false;
      
      // Check if sound is enabled (default to true)
      const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
      
      // Interaction is now guaranteed by the "Start" button in App.tsx,
      // so we can play with sound immediately.
      video.muted = !soundEnabled;

      const handleEnded = () => {
        if (onFinishedRef.current) onFinishedRef.current();
      };

      const handleError = (e: any) => {
        console.error("Splash video failed to load or play:", e);
        // Fallback: move past splash screen even if video fails
        if (onFinishedRef.current) onFinishedRef.current();
      };

      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);

      // Attempt to play
      const tryPlay = async () => {
        try {
          await video.play();
        } catch (error: any) {
          if (error.name === 'AbortError') return;
          
          console.warn("Splash video autoplay failed, trying muted fallback:", error);
          if (isMounted) {
            video.muted = true;
            try {
              await video.play();
            } catch (mutedError: any) {
              if (mutedError.name !== 'AbortError') {
                console.error("Autoplay completely failed:", mutedError);
                // If it fails even muted, just finish
                if (onFinishedRef.current) onFinishedRef.current();
              }
            }
          }
        }
      };

      tryPlay();

      return () => {
        isMounted = false;
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
      };
    }
  }, []);

  useEffect(() => {
    // TTS removed as per user request
  }, [loadingText]);

  useEffect(() => {
    const handleInteraction = () => {
      const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
      if (videoRef.current && videoRef.current.muted && soundEnabled) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {});
      }
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0F172A] flex items-center justify-center overflow-hidden">
      {/* Background Gradient to avoid "Black Screen" while video is loading */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-slate-900 to-blue-900 opacity-90" />
      
      {/* Background Video */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${showOverlay ? 'opacity-70' : 'opacity-100'}`}
        style={{ transform: 'scale(1.0)' }}
        playsInline
        autoPlay
      >
        <source src="/Splash.mp4" type="video/mp4" />
        {/* Fallback for browsers that don't support video */}
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      {showOverlay && (
        <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-white">
          {/* 
          Логотип удален по запросу пользователя. 
          Если захотите вернуть, раскомментируйте блок ниже.
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-[40px] border border-white/20 shadow-2xl animate-in zoom-in duration-700">
            <OneCLogo className="w-20 h-20 animate-pulse" />
          </div>
          */}
          
          {loadingText && (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10">
                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                <span className="text-sm font-black uppercase tracking-[0.2em]">{loadingText}</span>
              </div>
              
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
              </div>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
