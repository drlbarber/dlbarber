
import React from 'react';
import { useBooking } from '../BookingContext';
import { Lock } from 'lucide-react';

export const Footer = () => {
  const { setAdminMode, isAdminMode } = useBooking();

  return (
    <footer className="bg-[#050505] text-[10px] text-gray-600 py-8 px-6 flex flex-col items-center border-t border-white/5">
      <p className="mb-2">© 2024 Daryl Barber Studio.</p>
      <p className="mb-6">Conçu pour mobile.</p>
      
      <button 
        onClick={() => setAdminMode(!isAdminMode)}
        className="opacity-20 hover:opacity-100 transition-opacity p-2"
        aria-label="Admin Access"
      >
        <Lock className="w-3 h-3" />
      </button>
    </footer>
  );
};
