import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { ServiceCategory, ServiceItem, BookingForm } from '../types';
import { ChevronLeft, Check, User, LogIn, UserPlus, Calendar } from 'lucide-react';

const SERVICES_DATA: ServiceCategory[] = [
  {
    category: 'Cheveux',
    items: [
      { id: 'c1', name: 'Sh + coupe homme + barbe', duration: '30min', price: '20 €' },
      { id: 'c2', name: 'Sh + coupe homme', duration: '25min', price: '18 €' },
      { id: 'c3', name: 'Coupe homme', duration: '20min', price: '15 €' },
      { id: 'c4', name: 'Coupe enfant', duration: '30min', price: '15 €' },
      { id: 'c5', name: 'Coupe + barbe', duration: '30min', price: '20 €' },
    ]
  },
  {
    category: 'Barbe',
    items: [
      { id: 'b1', name: 'Rasage à l\'ancienne', duration: '20min', price: '7 €' },
      { id: 'b2', name: 'Taille de barbe', duration: '10min', price: '7 €' },
    ]
  },
  {
    category: 'Autres prestations',
    items: [
      { id: 'o1', name: 'Coloration', duration: '30min', price: '20 €', note: 'à partir de' },
      { id: 'o2', name: 'Défrisage', duration: '30min', price: '10 €', note: 'à partir de' },
    ]
  }
];

type BookingStep = 'service' | 'datetime' | 'auth' | 'guest-form' | 'confirmed';

export const Booking = () => {
  const { schedules, getFormattedDate, addBooking, getBookingsForDate } = useBooking();
  const [step, setStep] = useState<BookingStep>('service');
  
  // Selection State
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [guestForm, setGuestForm] = useState<BookingForm>({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  const sectionRef = useRef<HTMLElement>(null);
  
  const styles = {
    slab: {
      boxShadow: `-1px -1px 0px rgba(255, 255, 255, 0.04), 
                  10px 10px 20px rgba(0, 0, 0, 0.8), 
                  inset 1px 1px 1px rgba(255,255,255,0.05)`
    },
    texture: {
      filter: 'url(#stone-grain)'
    },
    textShadow: {
      textShadow: '2px 2px 0px #2c2c2c'
    }
  };

  // Current schedule helpers
  const currentDay = schedules[selectedDateIndex];
  const dayBookings = currentDay ? getBookingsForDate(currentDay.date) : [];
  
  const availableSlots = currentDay?.slots.filter(s => {
    // Check if slot is available AND not booked
    const isBooked = dayBookings.some(b => b.slotId === s.id);
    return s.isAvailable && !isBooked;
  }) || [];

  const selectedSlot = availableSlots.find(s => s.id === selectedSlotId);

  // Tilt Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const slabs = sectionRef.current.querySelectorAll('.slab-effect');
      const x = (window.innerWidth / 2 - e.pageX) / 80; 
      const y = (window.innerHeight / 2 - e.pageY) / 80;

      slabs.forEach((el) => {
        (el as HTMLElement).style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg)`;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handlers
  const handleServiceSelect = (service: ServiceItem) => {
    setSelectedService(service);
    setStep('datetime');
    const el = document.getElementById('booking');
    if(el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);
  };

  const confirmDateTime = () => {
    if (selectedSlotId) setStep('auth');
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentDay && selectedSlot && selectedService) {
        addBooking({
            id: Math.random().toString(36).substr(2, 9),
            date: currentDay.date,
            slotId: selectedSlot.id,
            time: selectedSlot.time,
            service: selectedService,
            client: guestForm
        });
        setStep('confirmed');
    }
  };

  const resetBooking = () => {
      setStep('service');
      setSelectedService(null);
      setSelectedSlotId(null);
      setGuestForm({ firstName: '', lastName: '', phone: '', email: '' });
  };

  // --- RENDERERS ---

  const renderServiceSelection = () => (
    <div className="animate-slide-up w-full max-w-2xl mx-auto">
       <header className="mb-8 text-center md:text-left">
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-gray-500 block mb-2">
            Étape 1 // 3
          </span>
          <h2 className="text-2xl font-bold uppercase text-basalt-accent" style={styles.textShadow}>
            Choisir une prestation
          </h2>
       </header>

       <div className="space-y-8">
          {SERVICES_DATA.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-apple-blue text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
                {cat.category}
              </h3>
              <div className="flex flex-col gap-3">
                {cat.items.map((item) => (
                  <div 
                    key={item.id}
                    className="group bg-basalt-mid p-4 rounded-sm border border-white/5 hover:border-white/20 transition-all flex justify-between items-center cursor-pointer"
                    onClick={() => handleServiceSelect(item)}
                  >
                    <div>
                      <h4 className="font-bold text-gray-200 group-hover:text-white transition-colors">{item.name}</h4>
                      <div className="flex gap-2 text-xs text-gray-500 mt-1 font-mono">
                        {item.note && <span>{item.note}</span>}
                        <span>{item.duration}</span>
                        <span className="text-gray-600">•</span>
                        <span>{item.price}</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-black border border-gray-700 text-[10px] uppercase font-bold text-white rounded hover:bg-white hover:text-black transition-colors">
                      Choisir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
       </div>
    </div>
  );

  const renderDateTimeSelection = () => (
    <div className="animate-slide-up w-full max-w-2xl mx-auto flex flex-col h-full">
        <header className="mb-6 flex items-center justify-between">
            <div>
                <span className="font-mono text-[10px] uppercase tracking-[2px] text-gray-500 block mb-2">
                    Étape 2 // 3
                </span>
                <h2 className="text-2xl font-bold uppercase text-basalt-accent" style={styles.textShadow}>
                    Créneau
                </h2>
            </div>
            <button 
                onClick={() => setStep('service')}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
                <ChevronLeft className="w-4 h-4" /> Retour
            </button>
        </header>

        {/* Selected Service Recap */}
        <div className="bg-apple-dark/50 border border-white/10 p-4 rounded mb-8 flex justify-between items-center">
            <div>
                <span className="text-[10px] text-apple-blue uppercase tracking-wider">Prestation</span>
                <p className="font-bold text-white">{selectedService?.name}</p>
                <p className="text-xs text-gray-500">{selectedService?.duration} • {selectedService?.price}</p>
            </div>
            <button onClick={() => setStep('service')} className="text-[10px] underline text-gray-500 hover:text-white">Modifier</button>
        </div>

        {/* Improved Date Strip */}
        <div className="mb-8">
            <h3 className="text-xs font-mono uppercase text-gray-500 mb-3 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Jours Disponibles
            </h3>
            <div 
                className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide snap-x"
                style={{ scrollBehavior: 'smooth' }}
            >
                {schedules.map((schedule, index) => {
                const { day, month, weekday } = getFormattedDate(schedule.date);
                const isSelected = selectedDateIndex === index;
                return (
                    <button 
                        key={schedule.date}
                        onClick={() => {
                            setSelectedDateIndex(index);
                            setSelectedSlotId(null);
                        }}
                        className={`
                            snap-start shrink-0 w-20 h-24 flex flex-col items-center justify-center rounded-lg border transition-all duration-300 relative overflow-hidden group
                            ${isSelected 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' 
                                : 'bg-basalt-mid border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5'}
                        `}
                    >
                        <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isSelected ? 'text-black/60' : 'text-gray-600'}`}>
                            {weekday}
                        </span>
                        <span className="font-space text-2xl font-bold mb-1">{day}</span>
                        <span className={`text-[9px] uppercase ${isSelected ? 'text-black/60' : 'text-gray-600'}`}>
                            {month}
                        </span>
                        
                        {/* Active Indicator Line */}
                        {isSelected && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-apple-blue"></div>
                        )}
                    </button>
                );
                })}
            </div>
        </div>

        {/* Time Slots */}
        <div className="flex flex-col gap-2 mb-8">
            <h3 className="text-xs font-mono uppercase text-gray-500 mb-2">Horaires pour le {getFormattedDate(currentDay?.date || '').weekday} {getFormattedDate(currentDay?.date || '').day}</h3>
            {availableSlots.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 text-gray-600 rounded bg-black/20">
                    <p className="font-mono text-xs">Aucun créneau disponible ce jour</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSlots.map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot.id)}
                            className={`
                                py-4 px-3 flex flex-col items-center justify-center border rounded transition-all duration-200 relative overflow-hidden
                                ${selectedSlotId === slot.id 
                                ? 'bg-apple-blue border-apple-blue text-white shadow-lg' 
                                : 'bg-basalt-mid text-white border-gray-800 hover:border-gray-500 hover:bg-white/5'}
                            `}
                        >
                            <span className="font-mono font-bold text-lg">{slot.time}</span>
                            {selectedSlotId === slot.id && (
                                <span className="absolute top-1 right-1">
                                    <Check className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <button 
            onClick={confirmDateTime}
            disabled={!selectedSlotId}
            className={`
                w-full p-4 font-space font-bold text-sm uppercase tracking-[2px] transition-all rounded-sm
                ${selectedSlotId 
                    ? 'bg-white text-black hover:bg-gray-200 shadow-xl cursor-pointer transform hover:-translate-y-1' 
                    : 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800'}
            `}
        >
            Valider le créneau
        </button>
    </div>
  );

  const renderAuthSelection = () => {
    const { day, month, weekday } = getFormattedDate(currentDay?.date || '');
    
    return (
    <div className="animate-slide-up w-full max-w-2xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
            <div>
                <span className="font-mono text-[10px] uppercase tracking-[2px] text-gray-500 block mb-2">
                    Étape 3 // 3
                </span>
                <h2 className="text-2xl font-bold uppercase text-basalt-accent" style={styles.textShadow}>
                    Identification
                </h2>
            </div>
            <button 
                onClick={() => setStep('datetime')}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
                <ChevronLeft className="w-4 h-4" /> Retour
            </button>
        </header>

        {/* Recap Box */}
        <div className="bg-basalt-mid border border-white/10 rounded-sm p-6 mb-8 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-apple-blue"></div>
            <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Prestation</span>
                    <p className="text-white font-bold">{selectedService?.name}</p>
                    <p className="text-xs text-gray-400">{selectedService?.duration} • {selectedService?.price}</p>
                </div>
                <button onClick={() => setStep('service')} className="text-[10px] text-apple-blue hover:underline">Modifier</button>
            </div>
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Date & Heure</span>
                    <p className="text-white font-bold capitalize">{weekday} {day} {month} à {selectedSlot?.time}</p>
                </div>
                <button onClick={() => setStep('datetime')} className="text-[10px] text-apple-blue hover:underline">Modifier</button>
            </div>
        </div>

        {/* Auth Options */}
        <div className="bg-white text-black rounded-sm p-8 shadow-2xl space-y-8">
            <div className="text-center">
                <h3 className="font-bold text-lg mb-4">Nouveau sur Daryl Barber ?</h3>
                <button className="w-full py-3 border-2 border-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2">
                   <UserPlus className="w-4 h-4" /> Créer mon compte
                </button>
            </div>

            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <span className="relative bg-white px-4 text-xs text-gray-500 font-mono uppercase">OU</span>
            </div>

            <div className="text-center">
                <h3 className="font-bold text-lg mb-4">Vous avez déjà un compte ?</h3>
                <button className="w-full py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                   <LogIn className="w-4 h-4" /> Se connecter
                </button>
            </div>

            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <span className="relative bg-white px-4 text-xs text-gray-500 font-mono uppercase">OU</span>
            </div>

            <div className="text-center">
                <button 
                    onClick={() => setStep('guest-form')}
                    className="text-sm font-bold underline hover:text-apple-blue transition-colors"
                >
                    Continuer en tant qu'invité
                </button>
            </div>
        </div>
    </div>
  )};

  const renderGuestForm = () => (
    <div className="animate-slide-up w-full max-w-2xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
            <div>
                 <span className="font-mono text-[10px] uppercase tracking-[2px] text-gray-500 block mb-2">
                    Invité
                </span>
                <h2 className="text-2xl font-bold uppercase text-basalt-accent" style={styles.textShadow}>
                    Vos Coordonnées
                </h2>
            </div>
            <button 
                onClick={() => setStep('auth')}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
                <ChevronLeft className="w-4 h-4" /> Retour
            </button>
        </header>

        <form onSubmit={handleGuestSubmit} className="bg-basalt-mid p-8 rounded-sm border border-white/5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500">Prénom</label>
                    <input 
                        required
                        type="text" 
                        className="w-full bg-black border border-gray-800 rounded p-3 text-white focus:border-white focus:outline-none transition-colors"
                        placeholder="John"
                        value={guestForm.firstName}
                        onChange={(e) => setGuestForm({...guestForm, firstName: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500">Nom</label>
                    <input 
                        required
                        type="text" 
                        className="w-full bg-black border border-gray-800 rounded p-3 text-white focus:border-white focus:outline-none transition-colors"
                        placeholder="Doe"
                        value={guestForm.lastName}
                        onChange={(e) => setGuestForm({...guestForm, lastName: e.target.value})}
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500">Téléphone</label>
                <input 
                    required
                    type="tel" 
                    className="w-full bg-black border border-gray-800 rounded p-3 text-white focus:border-white focus:outline-none transition-colors"
                    placeholder="06 12 34 56 78"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500">Email (optionnel)</label>
                <input 
                    type="email" 
                    className="w-full bg-black border border-gray-800 rounded p-3 text-white focus:border-white focus:outline-none transition-colors"
                    placeholder="john@example.com"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                />
            </div>

            <div className="pt-4">
                <button 
                    type="submit"
                    className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition-colors"
                >
                    Confirmer le Rendez-vous
                </button>
            </div>
        </form>
    </div>
  );

  const renderConfirmed = () => {
    const { day, month } = getFormattedDate(currentDay?.date || '');
    return (
    <div className="animate-slab-entry w-full max-w-xl mx-auto text-center">
        <div 
            className="bg-basalt-mid p-12 rounded-sm flex flex-col items-center justify-center text-center slab-effect border border-green-500/20"
            style={styles.slab}
        >
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <Check className="w-8 h-8 text-green-500" />
            </div>
            
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-green-500 mb-2">Confirmé</span>
            <h2 className="text-3xl font-bold text-white mb-6" style={styles.textShadow}>RENDEZ-VOUS VALIDÉ</h2>
            
            <div className="bg-black/40 p-6 rounded-sm w-full mb-8 border border-white/5 text-left">
                <div className="mb-4 pb-4 border-b border-white/10">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Prestation</span>
                    <p className="text-xl font-bold text-white mb-1">{selectedService?.name}</p>
                    <p className="text-xs text-gray-400">{selectedService?.duration} • {selectedService?.price}</p>
                </div>
                 
                <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Détails</span>
                    <p className="font-mono text-sm text-apple-blue mb-1">
                        {day} {month} à {selectedSlot?.time}
                    </p>
                    <div className="text-xs text-gray-400 font-mono">
                        Client: {guestForm.firstName} {guestForm.lastName}
                    </div>
                </div>
            </div>

            <button 
                onClick={resetBooking}
                className="text-basalt-accent text-xs font-mono tracking-wider border-b border-gray-600 pb-1 hover:text-white hover:border-white transition-colors"
            >
                NOUVELLE RÉSERVATION
            </button>
        </div>
    </div>
  )};

  return (
    <section 
      id="booking" 
      ref={sectionRef}
      className="bg-basalt-dark relative min-h-[800px] flex justify-center font-space overflow-hidden py-24"
    >
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-[0.04]" style={styles.texture}></div>

      <div className="relative z-10 w-full px-6 flex flex-col">
        {step === 'service' && renderServiceSelection()}
        {step === 'datetime' && renderDateTimeSelection()}
        {step === 'auth' && renderAuthSelection()}
        {step === 'guest-form' && renderGuestForm()}
        {step === 'confirmed' && renderConfirmed()}
      </div>
    </section>
  );
};
