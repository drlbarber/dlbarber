
import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { ServiceItem, BookingForm } from '../types';
import { Star, ChevronLeft, Tag, Clock, MessageSquare } from 'lucide-react';

const SERVICES_DATA: ServiceItem[] = [
  { id: 'cut', name: 'Coupe', duration: '', price: '15 €', note: 'FORME + CONTOURS' },
  { id: 'full', name: 'Coupe + Barbe', duration: '', price: '20 €', note: 'SOIN COMPLET' },
];

export const Booking = () => {
  const { schedules, getFormattedDate, addBooking, getBookingsForDate, getClientVisitCount, getAffiliateCode } = useBooking();
  
  // -- State --
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  
  // Time Selection State split into Hour and specific Slot
  const [selectedHour, setSelectedHour] = useState<string | null>(null); 
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  
  const [guestForm, setGuestForm] = useState<BookingForm>({
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  const [referralCode, setReferralCode] = useState('');
  const [visitCount, setVisitCount] = useState(0);

  // Capture Referral Link on Mount
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

  // Filter unique hours for the first view of Step 2
  const uniqueHours = Array.from(new Set(allSlots.map(s => s.time.split(':')[0])));

  // -- Check for Self-Referral --
  // We check if the user entered code matches the code associated with their own phone number
  const myOwnCode = guestForm.phone.length > 9 ? getAffiliateCode(guestForm.phone) : null;
  const isSelfReferral = myOwnCode && referralCode === myOwnCode;


  // -- Handlers --
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 3) {
      // Extra validation for step 3
      if (isSelfReferral) return;
      handleConfirmBooking();
    }
  };

  const handleBack = () => {
    // Special handling for Step 2 sub-navigation (Minutes -> Hours)
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

    // Add booking
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

    // --- TRIGGER SMS TO DARYL ---
    const d = getFormattedDate(currentSchedule.date);
    const smsBody = `Nouvelle réservation :\n${guestForm.firstName} ${guestForm.lastName}\n${d.weekday} ${d.day} ${d.month} à ${slot.time}\nService: ${selectedService.name}\nTél: ${guestForm.phone}`;
    
    // Open SMS app with Daryl's number
    window.open(`sms:0611584979?&body=${encodeURIComponent(smsBody)}`, '_self');
    // ----------------------------

    setTimeout(() => {
        const count = getClientVisitCount(guestForm.phone);
        setVisitCount(count);
        setCurrentStep(4); // Success State
    }, 100);
  };

  // -- Validation --
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

  // -- Styles (Scoped) --
  const styles = `
    .carbon-wrapper {
        --carbon-deep: #0a0a0a;
        --carbon-light: #161616;
        --blade-silver: #e0e0e0;
        --blade-dim: #444444;
        --accent-glow: #ffffff;
        --shear-angle: polygon(0% 0%, 100% 0%, 96% 100%, 0% 100%);
        --transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        font-family: 'Host Grotesk', sans-serif;
        color: var(--blade-silver);
        position: relative;
        width: 100%;
    }

    .carbon-overlay {
        position: absolute;
        inset: 0;
        background-image: 
            linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), 
            linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%), 
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%);
        background-size: 4px 4px;
        pointer-events: none;
        z-index: 0;
        opacity: 0.5;
    }

    .booking-container {
        width: 100%;
        max-width: 450px;
        margin: 0 auto;
        padding: 40px 24px;
        position: relative;
        z-index: 20;
    }

    .header-title {
        font-size: 3rem;
        font-weight: 800;
        letter-spacing: -2px;
        line-height: 0.9;
        text-transform: uppercase;
        font-style: italic;
        background: linear-gradient(180deg, #fff 0%, #444 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 20px;
    }

    .progress-bar {
        height: 2px;
        background: var(--blade-dim);
        margin-top: 15px;
        width: 100%;
        position: relative;
    }

    .progress-fill {
        height: 100%;
        background: var(--blade-silver);
        transition: var(--transition);
        box-shadow: 0 0 15px var(--accent-glow);
    }

    .step-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--blade-dim);
        margin-bottom: 20px;
        display: block;
    }

    .option-card {
        background: var(--carbon-light);
        border: 1px solid #222;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: var(--transition);
        clip-path: var(--shear-angle);
        position: relative;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .option-card:hover {
        background: #1a1a1a;
    }

    .option-card.selected {
        background: var(--blade-silver);
        color: var(--carbon-deep);
        transform: translateX(10px);
    }
    
    .option-card.selected .style-info p, 
    .option-card.selected .price {
        color: var(--carbon-deep);
        opacity: 1;
    }

    .style-info h3 {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 4px;
    }

    .style-info p {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.7rem;
        opacity: 0.6;
        text-transform: uppercase;
    }

    .price {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        font-size: 1rem;
    }

    .date-strip {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 15px;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .date-strip::-webkit-scrollbar { display: none; }

    .date-pill {
        min-width: 60px;
        height: 80px;
        background: var(--carbon-light);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border: 1px solid #222;
        transition: var(--transition);
        cursor: pointer;
    }

    .date-pill.selected {
        background: var(--blade-silver);
        color: var(--carbon-deep);
    }

    .time-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 20px;
    }

    .time-slot {
        padding: 15px;
        background: var(--carbon-light);
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        border: 1px solid #222;
        cursor: pointer;
        transition: var(--transition);
    }
    
    .time-slot:hover {
        border-color: #444;
    }

    .time-slot.selected {
        background: var(--blade-silver);
        color: var(--carbon-deep);
    }

    .time-slot.disabled {
        opacity: 0.2;
        cursor: not-allowed;
        text-decoration: line-through;
    }

    .input-group {
        position: relative;
        margin-top: 20px;
    }

    .input-group input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 2px solid var(--blade-dim);
        padding: 15px 0;
        color: white;
        font-size: 1.5rem;
        font-family: 'Host Grotesk', sans-serif;
        outline: none;
        transition: var(--transition);
    }

    .input-group input:focus {
        border-bottom-color: var(--blade-silver);
    }

    .input-group label {
        position: absolute;
        top: 15px;
        left: 0;
        color: var(--blade-dim);
        transition: var(--transition);
        pointer-events: none;
        text-transform: uppercase;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
    }

    .input-group input:focus ~ label,
    .input-group input:not(:placeholder-shown) ~ label {
        top: -15px;
        font-size: 0.6rem;
        color: var(--blade-silver);
    }

    .btn {
        flex: 1;
        padding: 20px;
        border: none;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        text-transform: uppercase;
        cursor: pointer;
        transition: var(--transition);
        clip-path: var(--shear-angle);
        width: 100%;
    }

    .btn-primary {
        background: var(--blade-silver);
        color: var(--carbon-deep);
    }

    .btn-secondary {
        background: transparent;
        border: 1px solid var(--blade-dim);
        color: var(--blade-silver);
    }
    
    .btn-secondary:hover {
        border-color: var(--blade-silver);
    }

    .btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
    
    .loyalty-card {
        background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 20px;
        margin-top: 30px;
        position: relative;
        overflow: hidden;
    }
    
    .loyalty-dots {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    }
    
    .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #333;
        transition: all 0.5s ease;
    }
    
    .dot.filled {
        background: #fff;
        box-shadow: 0 0 10px rgba(255,255,255,0.5);
    }
    
    .dot.free-cut {
        background: #0071e3;
        box-shadow: 0 0 15px #0071e3;
        transform: scale(1.3);
    }
    
    /* Animations */
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-step {
        animation: slideIn 0.5s ease forwards;
    }
  `;

  return (
    <section id="booking" className="bg-[#0a0a0a] relative min-h-screen flex items-center justify-center">
      <style>{styles}</style>
      
      <div className="carbon-wrapper">
        <div className="carbon-overlay"></div>

        <div className="booking-container">
          {/* Header */}
          <div className="mb-10">
            <h1 className="header-title">Service de<br/>Précision</h1>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* STEP 1: STYLE */}
          {currentStep === 1 && (
            <div className="animate-step">
              <span className="step-label">01. Choix du Service</span>
              <div className="flex flex-col gap-3">
                {SERVICES_DATA.map((service) => (
                    <div 
                        key={service.id}
                        className={`option-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                        onClick={() => setSelectedService(service)}
                    >
                        <div className="style-info">
                            <h3>{service.name}</h3>
                            <p>{service.note}</p>
                        </div>
                        <div className="price">{service.price}</div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: TIME */}
          {currentStep === 2 && (
            <div className="animate-step">
              <span className="step-label">02. Choix du Créneau</span>
              
              {/* Date Strip */}
              <div className="date-strip">
                {schedules.map((schedule, index) => {
                    const d = getFormattedDate(schedule.date);
                    const isSelected = selectedDateIndex === index;
                    return (
                        <div 
                            key={schedule.date}
                            className={`date-pill ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedDateIndex(index);
                                setSelectedHour(null);
                                setSelectedSlotId(null);
                            }}
                        >
                            <span className="font-mono text-[0.6rem] uppercase">{d.month}</span>
                            <span className="font-space text-lg font-bold">{d.day}</span>
                        </div>
                    );
                })}
              </div>

              {/* TWO LEVEL TIME SELECTION */}
              
              {/* Level 1: HOURS */}
              {!selectedHour && (
                  <div className="animate-step mt-6">
                      <p className="font-mono text-[10px] text-white/40 uppercase mb-4 tracking-widest text-center">Sélectionnez une heure</p>
                      <div className="time-grid">
                        {allSlots.length === 0 ? (
                            <div className="col-span-3 text-center py-8 text-white/30 font-mono text-xs">Aucun créneau disponible</div>
                        ) : (
                            uniqueHours.map((hour) => {
                                // Check if any slot in this hour is available
                                const hasAvailability = allSlots.some(s => s.time.startsWith(hour) && s.isAvailable && !isSlotTaken(s.time));
                                
                                return (
                                    <div 
                                        key={hour}
                                        className={`time-slot ${!hasAvailability ? 'disabled' : ''}`}
                                        onClick={() => hasAvailability && setSelectedHour(hour)}
                                    >
                                        {hour}h
                                    </div>
                                );
                            })
                        )}
                      </div>
                  </div>
              )}

              {/* Level 2: MINUTES (Slots) */}
              {selectedHour && (
                  <div className="animate-step mt-6">
                      <div className="flex justify-between items-center mb-4">
                           <button 
                             onClick={() => { setSelectedHour(null); setSelectedSlotId(null); }}
                             className="text-xs text-white/60 hover:text-white flex items-center gap-1 font-mono uppercase"
                           >
                             <ChevronLeft className="w-3 h-3" /> Retour
                           </button>
                           <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">{selectedHour}h</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                          {allSlots
                            .filter(s => s.time.startsWith(selectedHour))
                            .map((slot) => {
                              const isTaken = !slot.isAvailable || isSlotTaken(slot.time);
                              return (
                                  <div 
                                      key={slot.id}
                                      className={`time-slot ${selectedSlotId === slot.id ? 'selected' : ''} ${isTaken ? 'disabled' : ''}`}
                                      onClick={() => !isTaken && setSelectedSlotId(slot.id)}
                                  >
                                      {slot.time}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

            </div>
          )}

          {/* STEP 3: IDENTITY */}
          {currentStep === 3 && (
            <div className="animate-step">
              <span className="step-label">03. Vos Coordonnées</span>
              
              <div className="input-group">
                <input 
                    type="text" 
                    placeholder=" " 
                    value={guestForm.firstName}
                    onChange={(e) => setGuestForm({...guestForm, firstName: e.target.value})}
                />
                <label>Prénom</label>
              </div>

              <div className="input-group">
                <input 
                    type="text" 
                    placeholder=" " 
                    value={guestForm.lastName}
                    onChange={(e) => setGuestForm({...guestForm, lastName: e.target.value})}
                />
                <label>Nom</label>
              </div>

              <div className="input-group">
                <input 
                    type="tel" 
                    placeholder=" " 
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                />
                <label>Téléphone</label>
              </div>

              {/* REFERRAL CODE INPUT */}
              <div className="input-group">
                  <input 
                    type="text" 
                    placeholder=" "
                    maxLength={4}
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="tracking-widest"
                />
                <label className="flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Code Parrain (Optionnel)
                </label>
                {referralCode.length > 0 && referralCode.length < 4 && (
                    <span className="absolute right-0 top-4 text-[10px] text-red-500 font-mono">4 caractères requis</span>
                )}
                {referralCode.length === 4 && (
                    <span className={`absolute right-0 top-4 text-[10px] font-mono ${isSelfReferral ? 'text-red-500' : 'text-green-500'}`}>
                        {isSelfReferral ? 'Code personnel invalide' : 'Code valide'}
                    </span>
                )}
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {currentStep === 4 && (
            <div className="animate-step text-center py-6">
              
               {/* Pending Status Visual */}
               <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                   <Clock className="w-8 h-8 text-orange-500" />
               </div>

              <h2 className="text-[2rem] font-bold text-white mb-2 tracking-tighter uppercase italic leading-none">
                {isFreeCut ? 'GRATUIT !' : 'DEMANDE ENVOYÉE'}
              </h2>

              {/* Explicit Confirmation Message */}
              <div className="max-w-[90%] mx-auto mb-8 bg-[#111] border border-white/5 rounded-2xl p-4">
                  <p className="text-white/80 text-sm leading-relaxed">
                      Votre rendez-vous n'est <strong className="text-white">pas encore confirmé</strong>.
                  </p>
                  <div className="mt-3 flex items-start gap-3 text-left bg-black/50 p-3 rounded-lg border border-white/5">
                      <MessageSquare className="w-5 h-5 text-apple-blue shrink-0 mt-0.5" />
                      <p className="text-xs text-white/60">
                          Vous recevrez un <span className="text-apple-blue font-bold">SMS de validation</span> de Daryl une fois le créneau accepté.
                      </p>
                  </div>
              </div>
              
              <div className="bg-[#111] p-6 rounded-2xl border border-white/10 mb-8 mx-2 text-left">
                  <div className="grid grid-cols-1 gap-2 font-mono text-sm">
                      <div className="flex justify-between">
                          <span className="text-white/40">Service</span>
                          <span className="text-white font-bold">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-white/40">Date</span>
                          <span className="text-white">{getFormattedDate(currentSchedule.date).day} {getFormattedDate(currentSchedule.date).month} @ {allSlots.find(s => s.id === selectedSlotId)?.time}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-white/40">Client</span>
                          <span className="text-white uppercase">{guestForm.firstName} {guestForm.lastName}</span>
                      </div>
                      {referralCode && (
                          <div className="flex justify-between">
                             <span className="text-white/40">Code Parrain</span>
                             <span className="text-apple-blue">{referralCode}</span>
                          </div>
                      )}
                      {isFreeCut && (
                           <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                             <span className="text-apple-blue font-bold">TOTAL</span>
                             <span className="text-apple-blue font-bold">0 € (OFFERT)</span>
                           </div>
                      )}
                  </div>
              </div>

              {/* Loyalty Card */}
              <div className="loyalty-card">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase tracking-[2px] text-white/60">Fidélité</span>
                      <span className="text-xs font-mono text-white">{visitsTowardGoal}/8</span>
                  </div>
                  <div className="loyalty-dots">
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <div 
                            key={num} 
                            className={`dot ${num <= visitsTowardGoal ? 'filled' : ''}`}
                          />
                      ))}
                      <div className={`dot ${isFreeCut ? 'free-cut' : ''} border border-white/20 flex items-center justify-center`}>
                          {isFreeCut && <Star className="w-2 h-2 text-white fill-white" />}
                      </div>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-[9px] text-white/40 font-mono uppercase">
                        {isFreeCut ? 'Félicitations ! Votre fidélité est récompensée.' : 'Encore quelques coupes avant la gratuité.'}
                    </span>
                  </div>
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
                className="btn btn-secondary mt-8"
              >
                Réserver à nouveau
              </button>
            </div>
          )}

          {/* Navigation Actions */}
          {currentStep < 4 && (
            <div className="flex gap-3 mt-10">
                {/* Back Button Logic */}
                {(currentStep > 1 || (currentStep === 2 && selectedHour)) && (
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleBack}
                    >
                        Retour
                    </button>
                )}
                
                {/* Next Button Logic */}
                <button 
                    className="btn btn-primary" 
                    disabled={!isStepValid()}
                    onClick={handleNext}
                >
                    {currentStep === 3 ? 'Confirmer' : 'Suivant'}
                </button>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
