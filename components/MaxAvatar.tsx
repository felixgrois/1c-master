import React, { useEffect, useRef, useState } from 'react';

interface MaxAvatarProps {
  isSpeaking?: boolean;
  className?: string;
  reactionType?: 'SUCCESS' | 'FAILURE' | 'NEUTRAL';
  isInline?: boolean;
}

const MaxAvatar: React.FC<MaxAvatarProps> = ({ isSpeaking, className, reactionType = 'NEUTRAL', isInline = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    setVideoLoaded(false); // Reset on source change
    if (videoRef.current) {
      let src = "/max_avatar-1.mp4";
      
      if (reactionType === 'SUCCESS') {
        src = "/RightAnswer7.mp4";
      } else if (reactionType === 'FAILURE') {
        src = "/WrongAnswer.mp4";
      } else if (isSpeaking) {
        src = "/max_avatar.mp4";
      }

      videoRef.current.src = src;
      videoRef.current.load();
      videoRef.current.play().then(() => {
        setVideoLoaded(true);
      }).catch(err => {
        console.warn("MaxAvatar autoplay failed, displaying static image:", err);
      });
    }
  }, [reactionType, isSpeaking]);

  return (
    <div className={`relative ${className} flex items-end justify-center w-full h-full overflow-hidden rounded-3xl`}>
      {/* Static Fallback Image */}
      <img 
        src="/max_avatar-1.png" 
        className="absolute inset-0 w-full h-full object-cover object-bottom z-0 rounded-3xl scale-[1.15]"
        alt="Макс"
        referrerPolicy="no-referrer"
      />
      {/* Video Overlay */}
      <video
        ref={videoRef}
        loop={false}
        muted={reactionType === 'NEUTRAL'} // Neutral/idle is silent, feedback has real pre-recorded audio!
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        onPlaying={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-bottom z-10 transition-all duration-300 rounded-3xl ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        } ${reactionType !== 'NEUTRAL' ? 'scale-[1.28]' : 'scale-[1.15]'}`}
        poster="/max_avatar-1.png"
      />
    </div>
  );
};

export default MaxAvatar;
export { MaxAvatar };
