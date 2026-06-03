import React, { useEffect, useRef, useState } from 'react';

export type ReactionType = 'SUCCESS' | 'FAILURE' | 'NEUTRAL';

interface GuruReactionProps {
  type: ReactionType;
  className?: string;
  autoPlay?: boolean;
}

const GuruReaction: React.FC<GuruReactionProps> = ({ type, className = "", autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    setVideoLoaded(false);
    if (videoRef.current) {
      let src = "/max_avatar-1.mp4";
      if (type === 'SUCCESS') {
        src = "/RightAnswer7.mp4";
      } else if (type === 'FAILURE') {
        src = "/WrongAnswer.mp4";
      }
      
      videoRef.current.src = src;
      videoRef.current.load();
      if (autoPlay) {
        videoRef.current.play().then(() => {
          setVideoLoaded(true);
        }).catch(err => {
          console.warn("GuruReaction video autoplay failed, fallback to static image", err);
        });
      }
    }
  }, [type, autoPlay]);

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border-4 border-white shadow-lg bg-sky-50 flex items-center justify-center ${className}`}
    >
      {/* Static Fallback Image */}
      <img 
        src="/max_avatar-1.png" 
        className="absolute inset-0 w-full h-full object-cover z-0" 
        alt="Макс"
        referrerPolicy="no-referrer"
      />
      {/* Video Overlay */}
      <video
        ref={videoRef}
        loop={type === 'NEUTRAL'}
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        onPlaying={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        poster="/max_avatar-1.png"
      />
    </div>
  );
};

export default GuruReaction;
export { GuruReaction };
