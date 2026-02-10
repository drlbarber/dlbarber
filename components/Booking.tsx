
import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { ServiceItem, BookingForm } from '../types';
import { Star, ChevronLeft, Tag, Clock, MessageSquare, Calendar, CheckCircle } from 'lucide-react';

const SERVICES_DATA: ServiceItem[] = [
  { id: 'cut', name: 'Coupe', duration: '', price: '15 €', note: 'Structure & Finitions' },
  { id: 'full', name: 'Coupe + Barbe', duration: '', price: '20 €', note: 'Expérience Complète' },
];

export const Booking = () => {
  const { schedules, getFormattedDate, addBooking, getBookingsForDate, getClientVisitCount, getAffiliateCode } = useBooking();
  
  // -- State --
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  
  // Time Selection State
  const [selectedHour, setSelectedHour] = useState<string | null>(null); 
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  
  const [guestForm, setGuestForm] = useState<BookingForm>({
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  const [referralCode, setReferralCode] = useState('');
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
          setReferralCode(refCode.toUpperCase());
      }
  }, []);

  // -- Derived State --
  const currentSchedule = schedules[selectedDateIndex];
  const allSlots = currentSchedule?.slots || [];
  const dayBookings = currentSchedule ? getBookingsForDate(currentSchedule.date) : [];
  
  const isSlotTaken = (time: string) => dayBookings.some(b => b.time === time);
  const uniqueHours = Array.from(new Set(allSlots.map(s => s.time.split(':')[0])));

  const myOwnCode = guestForm.phone.length > 9 ? getAffiliateCode(guestForm.phone) : null;
  const isSelfReferral = myOwnCode && referralCode === myOwnCode;

  // -- Handlers --
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 3) {
      if (isSelfReferral) return;
      handleConfirmBooking();
    }
  };

  const handleBack = () => {
    if (currentStep === 2 && selectedHour) {
        setSelectedHour(null);
        setSelectedSlotId(null);
        return;
    }
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !currentSchedule || !selectedSlotId) return;

    const slot = allSlots.find(s => s.id === selectedSlotId);
    if (!slot) return;

    addBooking({
      id: Math.random().toString(36).substr(2, 9),
      date: currentSchedule.date,
      slotId: slot.id,
      time: slot.time,
      service: selectedService,
      client: guestForm,
      status: 'pending',
      usedReferralCode: referralCode.length === 4 ? referralCode.toUpperCase() : undefined
    });

    const d = getFormattedDate(currentSchedule.date);
    const smsBody = `Nouvelle réservation :\n${guestForm.firstName} ${guestForm.lastName}\n${d.weekday} ${d.day} ${d.month} à ${slot.time}\nService: ${selectedService.name}\nTél: ${guestForm.phone}`;
    
    window.open(`sms:0611584979?&body=${encodeURIComponent(smsBody)}`, '_self');

    setTimeout(() => {
        const count = getClientVisitCount(guestForm.phone);
        setVisitCount(count);
        setCurrentStep(4);
    }, 100);
  };

  const isStepValid = () => {
    if (currentStep === 1) return !!selectedService;
    if (currentStep === 2) return !!selectedSlotId;
    if (currentStep === 3) {
        const isFormFilled = guestForm.firstName.length > 1 && guestForm.lastName.length > 1 && guestForm.phone.length > 9;
        const isCodeValid = referralCode.length === 0 || (referralCode.length === 4 && !isSelfReferral);
        return isFormFilled && isCodeValid;
    }
    return false;
  };

  const isFreeCut = visitCount > 0 && visitCount % 8 === 0;
  const visitsTowardGoal = visitCount % 8 === 0 ? 8 : visitCount % 8;

  const styles = `
    .apple-glass {
        background: rgba(30, 30, 30, 0.6);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .apple-card {
        background: #1c1c1e;
        border-radius: 18px;
        transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .apple-card:active {
        transform: scale(0.98);
    }

    .apple-card.selected {
        border-color: #0071e3;
        background: rgba(0, 113, 227, 0.15);
        box-shadow: 0 0 0 1px #0071e3;
    }

    .apple-input {
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        transition: border-color 0.3s ease;
        border-radius: 0;
    }
    
    .apple-input:focus {
        border-color: #0071e3;
        outline: none;
    }

    .apple-btn {
        background: #0071e3;
        color: white;
        border-radius: 9999px;
        font-weight: 600;
        letter-spacing: -0.01em;
        transition: all 0.3s ease;
    }
    
    .apple-btn:hover:not(:disabled) {
        background: #0077ed;
        box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
    }
    
    .apple-btn:disabled {
        background: #3a3a3c;
        color: rgba(255, 255, 255, 0.3);
        cursor: not-allowed;
    }

    .apple-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 9999px;
        font-weight: 500;
    }

    /* Scrollbar invisible but functional */
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-enter {
        animation: fadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
  `;

  return (
    <section id="booking" className="bg-black relative min-h-screen flex items-center justify-center py-20 px-4">
      <style>{styles}</style>
      
      <div className="w-full max-w-[460px] mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-2">Réservation.</h2>
          <p className="text-white/40 text-sm font-medium">L'excellence, simplement.</p>
        </div>

        {/* STEP 1: SERVICE */}
        {currentStep === 1 && (
          <div className="animate-enter space-y-4">
            <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wide">01. Service</span>
            </div>
            {SERVICES_DATA.map((service) => (
                <div 
                    key={service.id}
                    className={`apple-card p-5 cursor-pointer flex justify-between items-center ${selectedService?.id === service.id ? 'selected' : 'hover:bg-[#2c2c2e]'}`}
                    onClick={() => setSelectedService(service)}
                >
                    <div>
                        <h3 className="text-lg font-medium text-white mb-1">{service.name}</h3>
                        <p className="text-xs text-white/50">{service.note}</p>
                    </div>
                    <div className="text-white font-medium bg-white/10 px-3 py-1 rounded-full text-sm">
                        {service.price}
                    </div>
                </div>
            ))}
          </div>
        )}

        {/* STEP 2: DATE & TIME */}
        {currentStep === 2 && (
          <div className="animate-enter">
             <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wide">02. Disponibilité</span>
            </div>
            
            {/* Date Strip */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-4">
              {schedules.map((schedule, index) => {
                  const d = getFormattedDate(schedule.date);
                  const isSelected = selectedDateIndex === index;
                  return (
                      <div 
                          key={schedule.date}
                          className={`min-w-[70px] h-[85px] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all border ${isSelected ? 'bg-white text-black border-white' : 'bg-[#1c1c1e] text-white/60 border-transparent hover:bg-[#2c2c2e]'}`}
                          onClick={() => {
                              setSelectedDateIndex(index);
                              setSelectedHour(null);
                              setSelectedSlotId(null);
                          }}
                      >
                          <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-60">{d.weekday}</span>
                          <span className="text-xl font-bold">{d.day}</span>
                          <span className="text-[10px] opacity-40 mt-1">{d.month}</span>
                      </div>
                  );
              })}
            </div>

            {/* Level 1: HOURS */}
            {!selectedHour && (
                <div className="animate-enter">
                    <p className="text-center text-white/30 text-xs mb-4 font-medium">Sélectionnez une heure</p>
                    <div className="grid grid-cols-4 gap-3">
                      {allSlots.length === 0 ? (
                          <div className="col-span-4 text-center py-10 text-white/30 text-sm">Aucun créneau ce jour</div>
                      ) : (
                          uniqueHours.map((hour) => {
                              const hasAvailability = allSlots.some(s => s.time.startsWith(hour) && s.isAvailable && !isSlotTaken(s.time));
                              return (
                                  <button 
                                      key={hour}
                                      disabled={!hasAvailability}
                                      onClick={() => hasAvailability && setSelectedHour(hour)}
                                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                                          hasAvailability 
                                          ? 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] hover:scale-105' 
                                          : 'bg-[#1c1c1e]/30 text-white/10 cursor-not-allowed'
                                      }`}
                                  >
                                      {hour}h
                                  </button>
                              );
                          })
                      )}
                    </div>
                </div>
            )}

            {/* Level 2: MINUTES */}
            {selectedHour && (
                <div className="animate-enter">
                    <div className="flex items-center justify-between mb-6">
                        <button 
                            onClick={() => { setSelectedHour(null); setSelectedSlotId(null); }}
                            className="flex items-center text-apple-blue text-sm font-medium hover:opacity-80 transition-opacity"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Retour
                        </button>
                        <span className="text-white font-bold text-lg">{selectedHour}h</span>
                        <div className="w-10"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {allSlots
                          .filter(s => s.time.startsWith(selectedHour))
                          .map((slot) => {
                            const isTaken = !slot.isAvailable || isSlotTaken(slot.time);
                            return (
                                <button 
                                    key={slot.id}
                                    disabled={isTaken}
                                    className={`py-4 rounded-xl text-sm font-medium border transition-all ${
                                        selectedSlotId === slot.id 
                                        ? 'bg-apple-blue border-apple-blue text-white shadow-lg' 
                                        : isTaken 
                                            ? 'bg-[#1c1c1e]/30 border-transparent text-white/10 cursor-not-allowed' 
                                            : 'bg-[#1c1c1e] border-transparent text-white hover:bg-[#2c2c2e]'
                                    }`}
                                    onClick={() => !isTaken && setSelectedSlotId(slot.id)}
                                >
                                    {slot.time}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
          </div>
        )}

        {/* STEP 3: INFO */}
        {currentStep === 3 && (
          <div className="animate-enter space-y-6">
             <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wide">03. Coordonnées</span>
            </div>

            <div className="space-y-5">
                <div className="group">
                    <input 
                        type="text" 
                        placeholder="Prénom" 
                        value={guestForm.firstName}
                        onChange={(e) => setGuestForm({...guestForm, firstName: e.target.value})}
                        className="apple-input w-full py-3 text-lg text-white placeholder:text-white/20"
                    />
                </div>
                <div className="group">
                    <input 
                        type="text" 
                        placeholder="Nom" 
                        value={guestForm.lastName}
                        onChange={(e) => setGuestForm({...guestForm, lastName: e.target.value})}
                        className="apple-input w-full py-3 text-lg text-white placeholder:text-white/20"
                    />
                </div>
                <div className="group">
                    <input 
                        type="tel" 
                        placeholder="Téléphone" 
                        value={guestForm.phone}
                        onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                        className="apple-input w-full py-3 text-lg text-white placeholder:text-white/20"
                    />
                </div>

                {/* Referral */}
                <div className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-white/40" />
                        <span className="text-xs text-white/40 font-medium uppercase tracking-wide">Code Parrain (Optionnel)</span>
                    </div>
                    <div className="relative">
                        <input 
                            type="text" 
                            maxLength={4}
                            placeholder="ex: LUC4"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            className="w-full bg-[#1c1c1e] rounded-xl py-3 px-4 text-white text-center tracking-[0.2em] font-medium border border-white/10 focus:border-apple-blue outline-none transition-colors"
                        />
                        {referralCode.length === 4 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isSelfReferral ? (
                                    <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded">Invalide</span>
                                ) : (
                                    <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">Valide</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {currentStep === 4 && (
          <div className="animate-enter text-center pt-8">
            <div className="w-20 h-20 bg-[#1c1c1e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
                {isFreeCut ? (
                    <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-pulse" />
                ) : (
                    <Clock className="w-10 h-10 text-white/80" />
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-black">
                    <CheckCircle className="w-4 h-4 text-black" />
                </div>
            </div>

            <h2 className="text-3xl font-semibold text-white mb-2">{isFreeCut ? 'Gratuité Appliquée !' : 'Demande Envoyée'}</h2>
            <p className="text-white/50 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
                Votre demande a bien été reçue. Vous recevrez une <strong className="text-white">confirmation SMS</strong> de Daryl très prochainement.
            </p>

            <div className="apple-card p-6 text-left mb-8 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/40 text-sm">Service</span>
                    <span className="text-white font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-white/40 text-sm">Date</span>
                    <span className="text-white font-medium">{getFormattedDate(currentSchedule.date).day} {getFormattedDate(currentSchedule.date).month} à {allSlots.find(s => s.id === selectedSlotId)?.time}</span>
                </div>
                {isFreeCut && (
                    <div className="flex justify-between items-center py-2">
                        <span className="text-yellow-400 text-sm font-bold">Total</span>
                        <span className="text-yellow-400 font-bold">0 € (OFFERT)</span>
                    </div>
                )}
            </div>

            <button 
                onClick={() => {
                    setCurrentStep(1);
                    setSelectedService(null);
                    setSelectedSlotId(null);
                    setSelectedHour(null);
                    setReferralCode('');
                    setGuestForm({ firstName: '', lastName: '', phone: '' });
                }}
                className="apple-btn-secondary py-3 px-8 text-sm"
            >
                Nouvelle Réservation
            </button>
          </div>
        )}

        {/* Navigation */}
        {currentStep < 4 && (
            <div className="mt-12 flex gap-3">
                {(currentStep > 1 || (currentStep === 2 && selectedHour)) && (
                     <button 
                        onClick={handleBack}
                        className="apple-btn-secondary flex-1 py-4 text-sm"
                    >
                        Retour
                    </button>
                )}
                
                <button 
                    disabled={!isStepValid()}
                    onClick={handleNext}
                    className="apple-btn flex-1 py-4 text-sm shadow-lg shadow-blue-900/20"
                >
                    {currentStep === 3 ? 'Confirmer la demande' : 'Continuer'}
                </button>
            </div>
        )}
        
      </div>
    </section>
  );
};
