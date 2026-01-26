
import React from 'react';
import { useBooking } from '../BookingContext';
import { Lock, Instagram } from 'lucide-react';

export const Footer = () => {
  const { setAdminMode, isAdminMode } = useBooking();

  return (
    <footer className="bg-[#050505] text-[10px] text-white/30 py-12 px-6 flex flex-col items-center border-t border-white/5 space-y-6">
      
      {/* Daryl Instagram */}
      <a 
        href="https://instagram.com/dl_barber_49" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-white/60 hover:text-apple-blue transition-colors px-4 py-2 bg-white/5 rounded-full border border-white/5 hover:border-apple-blue/30"
      >
        <Instagram className="w-3 h-3" />
        <span className="font-mono tracking-wider">@dl_barber_49</span>
      </a>

      <div className="text-center space-y-2">
        <p>© 2024 Daryl Barber Studio.</p>
        
        {/* Satoshi Credit */}
        <p className="flex items-center justify-center gap-1 opacity-60">
          <span>Site par</span>
          <a 
            href="https://instagram.com/satoshi.mkf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors border-b border-transparent hover:border-white/30"
          >
            @satoshi.mkf
          </a>
        </p>
      </div>
      
      {/* Admin Lock */}
      <button 
        onClick={() => setAdminMode(!isAdminMode)}
        className="opacity-20 hover:opacity-100 transition-opacity p-4 mt-4"
        aria-label="Admin Access"
      >
        <Lock className="w-3 h-3" />
      </button>
    </footer>
  );
};
