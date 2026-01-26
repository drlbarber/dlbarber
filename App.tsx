
import React, { useEffect, useState, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BeforeAfter } from './components/BeforeAfter';
import { Booking } from './components/Booking';
import { Footer } from './components/Footer';
import { BookingProvider } from './BookingContext';
import { AdminInterface } from './components/AdminInterface';

function App() {
  const [beforeAfterScale, setBeforeAfterScale] = useState(1);
  const [beforeAfterOpacity, setBeforeAfterOpacity] = useState(1);
  const bookingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!bookingRef.current) return;
      
      const bookingRect = bookingRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the Booking section is visible
      // When bookingRect.top is at windowHeight, it's just starting to enter.
      // When bookingRect.top is at 0, it fully covers the screen.
      
      if (bookingRect.top < windowHeight) {
        const progress = 1 - (bookingRect.top / windowHeight);
        // Scale down from 1 to 0.9 as Booking slides up
        const scale = Math.max(0.9, 1 - (progress * 0.1));
        // Fade out slightly to 0.5
        const opacity = Math.max(0.5, 1 - (progress * 0.5));
        
        setBeforeAfterScale(scale);
        setBeforeAfterOpacity(opacity);
      } else {
        setBeforeAfterScale(1);
        setBeforeAfterOpacity(1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <BookingProvider>
        <div className="w-full bg-black text-white selection:bg-apple-blue selection:text-white pb-safe">
            <Navbar />
            
            <main className="relative w-full">
                {/* Fixed Hero Section (Layer 0) */}
                <div className="fixed top-0 left-0 w-full h-screen z-0">
                    <Hero />
                </div>

                {/* Spacer to push content down initially */}
                <div className="h-screen w-full pointer-events-none" />

                {/* Layer 1: Transformations - Sticky Card */}
                {/* Acts as a stacking card that gets covered by Booking */}
                <div className="sticky top-0 z-10 h-screen w-full flex flex-col shadow-2xl">
                    <div 
                        className="w-full h-full transition-transform duration-75 ease-linear origin-top"
                        style={{ 
                            transform: `scale(${beforeAfterScale})`,
                            opacity: beforeAfterOpacity,
                            filter: `brightness(${beforeAfterOpacity})`
                        }}
                    >
                        <BeforeAfter />
                    </div>
                </div>

                {/* Layer 2: Booking - Slides over Transformations */}
                <div 
                    ref={bookingRef}
                    className="relative z-20 bg-[#050505] rounded-t-[3rem] shadow-[0_-50px_100px_rgba(0,0,0,0.8)] border-t border-white/10"
                >
                    <Booking />
                    <Footer />
                </div>

            </main>

            <AdminInterface />
        </div>
    </BookingProvider>
  );
}

export default App;
