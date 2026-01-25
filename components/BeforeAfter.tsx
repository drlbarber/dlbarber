import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TRANSFORMATIONS = [
  {
    id: '045',
    label: 'Natural Flow',
    before: 'https://i.postimg.cc/zf38xXzW/Capture-d-e-cran-2026-01-24-a-13-14-39.png',
    after: 'https://i.postimg.cc/XvX4s7jw/Capture-d-e-cran-2026-01-24-a-13-14-58.png'
  },
  {
    id: '044',
    label: 'Texture Crop',
    before: 'https://i.postimg.cc/jScS8Fzb/Capture-d-e-cran-2026-01-24-a-13-13-46.png',
    after: 'https://i.postimg.cc/Gpph6xjV/Capture-d-e-cran-2026-01-24-a-13-14-03.png'
  },
  {
    id: '042',
    label: 'Restyle',
    before: 'https://i.postimg.cc/W3DCkd2f/Capture-d-e-cran-2026-01-24-a-13-05-30.png',
    after: 'https://i.postimg.cc/NjfNXKD2/Capture-d-e-cran-2026-01-24-a-13-08-46.png'
  },
  {
    id: '043',
    label: 'Fade Precision',
    before: 'https://i.postimg.cc/jqDnDtP9/Capture-d-e-cran-2026-01-24-a-13-12-17.png',
    after: 'https://i.postimg.cc/fWVSVDm1/Capture-d-e-cran-2026-01-24-a-13-12-48.png'
  }
];

export const BeforeAfter = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeClient = TRANSFORMATIONS[activeIndex];

  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const newPos = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(newPos);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  const handleInteractionStart = () => setIsDragging(true);
  
  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  const nextClient = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % TRANSFORMATIONS.length);
  };

  const prevClient = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + TRANSFORMATIONS.length) % TRANSFORMATIONS.length);
  };

  return (
    <section className="relative w-full bg-black h-full flex flex-col items-center justify-center overflow-hidden font-outfit rounded-t-[3rem] z-10">
      <style>{`
        .latex-grain {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3BaseFilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        .latex-slider::before {
          content: '';
          position: absolute;
          height: 100%;
          width: 60px;
          background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);
          transform: translateX(-50%);
          left: 50%;
          pointer-events: none;
        }

        .handle-blob {
          width: 4px;
          height: 120px;
          background: rgba(255,255,255,0.9);
          border-radius: 100px;
          box-shadow: 0 0 30px rgba(255,255,255,0.4), 0 0 10px rgba(255,255,255,0.8);
          position: relative;
          transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .handle-blob::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 160px;
          background: rgba(245, 235, 235, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
          border: 1px solid rgba(255,255,255,0.1);
          mask-image: linear-gradient(transparent, black, transparent);
        }

        .active-blob {
          transform: scaleX(2) scaleY(0.95);
          background: #ff0055;
        }
      `}</style>

      <div className="latex-grain"></div>

      <div className="relative w-full h-full flex flex-col">
        {/* Header UI */}
        <header className="absolute top-12 left-6 right-6 z-50 flex justify-between items-start pointer-events-none">
          <div className="animate-fade-in" key={`header-${activeClient.id}`}>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-2">
              System.Reform // {activeClient.id}
            </span>
            <h1 className="text-3xl font-black leading-[0.9] uppercase tracking-tighter text-white">
              VISUAL<br/><span className="text-white/40">SHIFT</span>
            </h1>
          </div>
          
          <div className="flex gap-2 pointer-events-auto mt-2">
            <button 
              onClick={prevClient}
              className="w-10 h-10 flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextClient}
              className="w-10 h-10 flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Comparison Stage */}
        <div 
          id="stage"
          ref={containerRef}
          className="relative flex-1 w-full cursor-ew-resize touch-none select-none"
          onMouseDown={handleInteractionStart}
          onMouseMove={onMouseMove}
          onTouchStart={handleInteractionStart}
          onTouchMove={onTouchMove}
        >
          {/* Side Labels */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full px-5 flex justify-between pointer-events-none z-20 mix-blend-difference">
            <span className="font-mono text-[10px] tracking-[4px] opacity-60 text-white vertical-lr uppercase writing-vertical-lr rotate-180">
              Raw_Input
            </span>
            <span className="font-mono text-[10px] tracking-[4px] opacity-60 text-white vertical-lr uppercase writing-vertical-lr rotate-180">
              Final_Render
            </span>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {/* After Image (Background) */}
            <div 
              key={`after-${activeClient.id}`}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-[1] animate-fade-in"
              style={{ backgroundImage: `url(${activeClient.after})` }}
            />
            
            {/* Before Image (Foreground - Clipped) */}
            <div 
              key={`before-${activeClient.id}`}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-[2] animate-fade-in"
              style={{ 
                backgroundImage: `url(${activeClient.before})`,
                clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`
              }}
            />
          </div>

          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] z-30 -translate-x-1/2 flex items-center justify-center latex-slider"
            style={{ 
              left: `${position}%`,
              background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.6), transparent)'
            }}
          >
            <div className={`handle-blob ${isDragging ? 'active-blob' : ''}`}></div>
          </div>
        </div>

        {/* Footer UI */}
        <footer className="absolute bottom-32 left-6 right-6 z-50 flex justify-between items-end pointer-events-none">
          <div className="px-3 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#ff0055] rounded-full animate-pulse"></div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white">Interactive</span>
          </div>

          <div className="text-right">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 block mb-1">
              Morph %
            </span>
            <div className="font-mono text-sm font-medium text-white">
              {position.toFixed(2)}%
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};