
import React from 'react';
import { Haircut } from '../types';

const HAIRCUTS: Haircut[] = [
  { id: 1, title: 'Fade Master', category: 'Dégradé', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1000&auto=format&fit=crop' },
  { id: 2, title: 'Textured Crop', category: 'Ciseaux', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop' },
  { id: 3, title: 'Classic', category: 'Style', image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1000&auto=format&fit=crop' },
  { id: 4, title: 'Sharp Line', category: 'Contours', image: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=1000&auto=format&fit=crop' },
];

export const Gallery = () => {
  return (
    <section id="gallery" className="bg-black py-12">
      <div className="px-6 mb-6 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Collections
        </h2>
        <span className="text-xs text-gray-500">Glisser →</span>
      </div>

      {/* Horizontal Snap Scroll */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-8 no-scrollbar">
        {HAIRCUTS.map((cut) => (
          <div 
            key={cut.id} 
            className="snap-center shrink-0 w-[80vw] aspect-[3/4] relative rounded-2xl overflow-hidden bg-gray-900"
          >
            <img 
              src={cut.image} 
              alt={cut.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-0 left-0 p-6">
              <span className="text-apple-blue text-[10px] font-bold uppercase tracking-wider mb-1 block">
                {cut.category}
              </span>
              <h3 className="text-xl font-bold text-white">{cut.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
