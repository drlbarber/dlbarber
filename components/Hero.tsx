import React, { useEffect, useState } from 'react';

export const Hero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBooking = () => {
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Parallax calculations
  const contentOpacity = Math.max(0, 1 - scrollY / (window.innerHeight * 0.6));
  const contentScale = Math.max(0.8, 1 - scrollY / (window.innerHeight * 2));
  const blurAmount = Math.min(20, scrollY / 20);

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden flex items-center justify-center font-sans">
      
      {/* Metaball Filter SVG Definition */}
      <svg className="absolute h-0 w-0">
        <defs>
          <filter id="metaball">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -15" 
              result="contrast" 
            />
          </filter>
        </defs>
      </svg>

      {/* Foam/Bubble Layer - Parallax speed 0.5 */}
      <div 
        className="absolute inset-0 w-full h-full" 
        style={{ 
            filter: 'url(#metaball)',
            transform: `translateY(-${scrollY * 0.2}px)` // Subtle parallax for background
        }}
      >
        <div className="absolute w-[150px] h-[150px] bg-black rounded-full top-[20%] left-[30%] animate-drift-slow"></div>
        <div className="absolute w-[200px] h-[200px] bg-black rounded-full bottom-[20%] right-[30%] animate-drift-medium"></div>
        <div className="absolute w-[100px] h-[100px] bg-black rounded-full top-[50%] left-[50%] animate-drift-fast"></div>
        <div className="absolute w-[80px] h-[80px] bg-black rounded-full top-[15%] right-[10%] animate-drift-fast"></div>
        <div className="absolute w-[120px] h-[120px] bg-black rounded-full bottom-[10%] left-[10%] animate-drift-slow"></div>
      </div>

      {/* Content Layer - Fades out and scales down */}
      <div 
        className="z-10 text-center mix-blend-difference text-white flex flex-col items-center justify-center p-4"
        style={{
            opacity: contentOpacity,
            transform: `scale(${contentScale}) translateY(${scrollY * 0.1}px)`,
            filter: `blur(${blurAmount}px)`
        }}
      >
        <h1 className="text-[18vw] font-black leading-[0.8] m-0 tracking-tighter">DARYL</h1>
        <p className="text-[1rem] font-light mt-3 tracking-[8px] uppercase">The Grooming Lab</p>
        
        <button 
          onClick={scrollToBooking}
          className="mt-12 px-8 py-3 rounded-full border border-white text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          Réserver
        </button>
      </div>

      {/* Scroll indicator that fades out quickly */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 mix-blend-difference text-white flex flex-col items-center gap-2"
        style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
      </div>
    </div>
  );
};