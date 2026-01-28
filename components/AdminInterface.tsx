
import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { 
  X, Lock, Settings, Power, Phone, CheckCircle, XCircle, 
  Activity, Trash2, UserPlus, Ban, Search, Gift, Zap, Calendar, Star, Wifi, WifiOff, Database
} from 'lucide-react';
import { ClientBooking } from '../types';

export const AdminInterface = () => {
  const { 
    isAdminMode, 
    setAdminMode, 
    isAuthenticated, 
    authenticate, 
    logout,
    schedules, 
    getBookingsForDate,
    updateBookingStatus,
    deleteBooking,
    addBooking,
    toggleSlotAvailability,
    bookings,
    getFormattedDate,
    getReferralBalance,
    redeemReferralRewards,
    applyLoyaltyFreeCut,
    getClientVisitCount,
    isDbConnected
  } = useBooking();

  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<ClientBooking | null>(null);
  const [view, setView] = useState<'schedule' | 'stats' | 'loyalty'>('schedule');

  // Manual Booking State
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [manualSlotId, setManualSlotId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');

  // DB Config State
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState('');

  // Loyalty Lookup State
  const [scanPhone, setScanPhone] = useState('');
  const [scanReferral, setScanReferral] = useState<{count: number, creditAmount: number} | null>(null);
  const [scanVisits, setScanVisits] = useState<number>(0);
  const [clientBookings, setClientBookings] = useState<ClientBooking[]>([]);

  // Sync selected date with schedule
  const currentDateSchedule = schedules[selectedDateIndex] || { date: new Date().toISOString(), slots: [] };
  
  // Login Handler
  useEffect(() => {
    if (pin.length === 4) {
      const isValid = authenticate(pin);
      if (isValid) {
        setPin('');
      } else {
        setIsShaking(true);
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 400);
      }
    }
  }, [pin, authenticate]);

  // Load existing DB URL into input when config opens
  useEffect(() => {
      if (showDbConfig) {
          setDbUrlInput(localStorage.getItem('daryl_db_url') || '');
      }
  }, [showDbConfig]);

  const handleKeypad = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleSaveDbUrl = () => {
      if (dbUrlInput.trim()) {
          localStorage.setItem('daryl_db_url', dbUrlInput.trim());
          alert("Configuration sauvegardée. L'application va redémarrer.");
          window.location.reload();
      } else {
          localStorage.removeItem('daryl_db_url');
          alert("Configuration supprimée. Retour au mode hors ligne.");
          window.location.reload();
      }
  };

  const handleStatusUpdate = (status: 'confirmed' | 'rejected') => {
    if (selectedBooking) {
      updateBookingStatus(selectedBooking.id, status);
      
      // -- SMS Notification Trigger --
      if (status === 'confirmed' && selectedBooking.client.phone) {
        const d = getFormattedDate(selectedBooking.date);
        const dateStr = `${d.weekday} ${d.day} ${d.month}`;
        const message = `Bonjour ${selectedBooking.client.firstName}, votre rendez-vous chez Daryl Barber est confirmé pour le ${dateStr} à ${selectedBooking.time}. A bientôt !`;
        
        // Open native SMS app
        window.open(`sms:${selectedBooking.client.phone}?&body=${encodeURIComponent(message)}`, '_blank');
      }

      setSelectedBooking(null);
    }
  };

  const handleDelete = () => {
    if (selectedBooking) {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
        deleteBooking(selectedBooking.id);
        setSelectedBooking(null);
      }
    }
  };

  const handleCreateWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSlotId || !manualName) return;

    const slot = currentDateSchedule.slots.find(s => s.id === manualSlotId);
    if (!slot) return;

    addBooking({
      id: Math.random().toString(36).substr(2, 9),
      date: currentDateSchedule.date,
      slotId: slot.id,
      time: slot.time,
      service: { id: 'manual', name: 'Passage / Manuel', duration: '', price: '20 €' },
      client: { firstName: manualName, lastName: '', phone: '' },
      status: 'walk-in'
    });

    setManualName('');
    setManualSlotId(null);
    setIsManualBookingOpen(false);
  };

  const checkLoyalty = () => {
      if (scanPhone.length > 9) {
          // 1. Referral Balance
          const referralRes = getReferralBalance(scanPhone);
          setScanReferral(referralRes);

          // 2. Classic Loyalty Visits
          const visits = getClientVisitCount(scanPhone);
          setScanVisits(visits);

          // 3. Find relevant bookings (Today & Future)
          const cleanPhone = scanPhone.replace(/\D/g, '');
          const relevant = bookings.filter(b => {
              const bPhone = b.client.phone.replace(/\D/g, '');
              const isMatch = bPhone === cleanPhone;
              const isNotRejected = b.status !== 'rejected';
              return isMatch && isNotRejected;
          }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          setClientBookings(relevant);
      }
  };

  const handleRedeemReferral = async (bookingId: string) => {
      if (!scanReferral) return;
      if (scanReferral.creditAmount === 0) return;
      
      const confirmMsg = `Utiliser le solde parrainage (${scanReferral.creditAmount} €) pour réduire le prix de cette coupe ?`;

      if (window.confirm(confirmMsg)) {
          await redeemReferralRewards(scanPhone, bookingId);
          alert("Réduction parrainage appliquée !");
          checkLoyalty(); // Refresh data
      }
  };

  const handleApplyLoyaltyCut = async (bookingId: string) => {
      if (window.confirm("Valider la 8ème coupe offerte pour ce client ?")) {
          await applyLoyaltyFreeCut(bookingId);
          alert("Gratuité fidélité appliquée !");
          checkLoyalty(); // Refresh data
      }
  };

  // Render Logic
  if (!isAdminMode) return null;

  // -- AUTH SCREEN --
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
        <button 
          onClick={() => setAdminMode(false)}
          className="absolute top-6 right-6 text-white/50 hover:text-white p-4"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-sm flex flex-col items-center relative">
          
          {/* DB Config Button (Bottom Left of Panel) */}
          {!showDbConfig && (
            <button 
                onClick={() => setShowDbConfig(true)}
                className="absolute -top-16 left-0 p-2 text-white/20 hover:text-white transition-colors"
                title="Configurer Base de Données"
            >
                <Settings className="w-5 h-5" />
            </button>
          )}

          <div className="mb-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 relative">
              <Lock className="w-6 h-6 text-white" />
              {isDbConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111]"></div>
              )}
            </div>
            <h2 className="text-2xl font-space font-bold text-white mb-2">Accès Système</h2>
            <p className="text-white/40 text-sm font-mono">
                {isDbConnected ? 'Système ONLINE' : 'Mode HORS LIGNE'}
            </p>
          </div>

          {showDbConfig ? (
               <div className="w-full bg-[#111] p-6 rounded-2xl border border-white/10 animate-fade-in mb-8">
                   <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                       <Database className="w-4 h-4 text-apple-blue" />
                       Connexion BDD
                   </h3>
                   <p className="text-[10px] text-white/50 mb-3">
                       Collez votre lien de connexion Neon/Postgres ici (commence par <code>postgres://</code>)
                   </p>
                   <input 
                        type="text" 
                        value={dbUrlInput} 
                        onChange={(e) => setDbUrlInput(e.target.value)}
                        placeholder="postgres://user:pass@endpoint.neon.tech/neondb"
                        className="w-full bg-black border border-white/20 rounded p-3 text-xs text-white font-mono mb-4 focus:border-apple-blue outline-none"
                   />
                   <div className="flex gap-2">
                       <button onClick={() => setShowDbConfig(false)} className="flex-1 py-3 bg-white/5 rounded hover:bg-white/10 text-white/60 text-xs font-bold uppercase">Annuler</button>
                       <button onClick={handleSaveDbUrl} className="flex-1 py-3 bg-white text-black rounded hover:bg-gray-200 text-xs font-bold uppercase">Sauvegarder</button>
                   </div>
               </div>
          ) : (
            <>
                <div className={`flex gap-6 mb-12 ${isShaking ? 'animate-[drift-fast_0.2s_ease-in-out]' : ''}`}>
                    {[0, 1, 2, 3].map((i) => (
                    <div 
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        i < pin.length ? 'bg-white scale-110 shadow-[0_0_10px_white]' : 'bg-white/10'
                        }`}
                    />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-6 w-full px-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleKeypad(num.toString())}
                        className={`aspect-square flex items-center justify-center rounded-full text-2xl font-space font-bold text-white hover:bg-white/10 active:bg-white/20 transition-colors active:scale-95 ${num === 0 ? 'col-start-2' : ''}`}
                    >
                        {num}
                    </button>
                    ))}
                    <div className="col-start-3 row-start-4 flex items-center justify-center">
                    <button
                        onClick={() => setPin(prev => prev.slice(0, -1))}
                        className="w-full aspect-square flex items-center justify-center rounded-full text-white/50 hover:text-white transition-colors active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    </div>
                </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // -- DASHBOARD --
  const dayBookings = getBookingsForDate(currentDateSchedule.date);
  
  // Stats
  const totalBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'walk-in').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const estimatedRevenue = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'walk-in')
        .reduce((acc, curr) => {
            const price = parseInt(curr.service.price.replace(/[^0-9]/g, '')) || 0;
            return acc + price;
        }, 0);

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col animate-slide-up">
      {/* Top Bar */}
      <header className="flex justify-between items-center p-4 sm:p-6 border-b border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
                <h1 className="font-space font-bold text-white text-lg leading-tight">Admin</h1>
                <div className="flex items-center gap-2 mt-1">
                    {isDbConnected ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <Wifi className="w-3 h-3 text-green-500" />
                            <span className="text-[9px] text-green-500 font-bold tracking-wider">SYNC LIVE</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                            <WifiOff className="w-3 h-3 text-red-500" />
                            <span className="text-[9px] text-red-500 font-bold tracking-wider">OFFLINE</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <button 
          onClick={logout}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-500 flex items-center justify-center transition-colors"
        >
          <Power className="w-4 h-4" />
        </button>
      </header>

      {/* Warning Banner if Offline */}
      {!isDbConnected && (
        <div className="bg-red-500/10 border-b border-red-500/10 px-6 py-2">
            <p className="text-[10px] text-red-400 text-center font-mono">
                ⚠️ Aucune base de données. Les données sont locales à cet appareil.
            </p>
        </div>
      )}

      {/* View Selector */}
      <div className="p-4 border-b border-white/5 bg-[#050505]">
         <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setView('schedule')}
                className={`flex-1 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors ${view === 'schedule' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
            >
                Planning
            </button>
            <button 
                onClick={() => setView('stats')}
                className={`flex-1 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors ${view === 'stats' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
            >
                Stats
            </button>
            <button 
                onClick={() => setView('loyalty')}
                className={`flex-1 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors ${view === 'loyalty' ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
            >
                Fidélité
            </button>
         </div>

         {view === 'schedule' && (
             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
                {schedules.map((schedule, index) => {
                    const d = getFormattedDate(schedule.date);
                    const isActive = index === selectedDateIndex;
                    return (
                        <button
                            key={schedule.date}
                            onClick={() => setSelectedDateIndex(index)}
                            className={`
                                flex flex-col items-center justify-center min-w-[4.5rem] h-16 rounded-lg border transition-all snap-center
                                ${isActive 
                                    ? 'bg-white/10 border-apple-blue text-white shadow-[0_0_15px_rgba(0,113,227,0.3)]' 
                                    : 'bg-[#111] border-white/5 text-gray-500'}
                            `}
                        >
                            <span className="text-[9px] font-mono uppercase">{d.weekday}</span>
                            <span className="text-lg font-bold font-space">{d.day}</span>
                        </button>
                    )
                })}
             </div>
         )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        
        {view === 'loyalty' && (
            <div className="flex flex-col items-center justify-start h-full max-w-sm mx-auto space-y-4">
                
                {/* Search Bar */}
                <div className="bg-[#111] p-6 rounded-3xl border border-white/10 w-full text-center">
                    <h3 className="text-white font-space font-bold text-xl mb-4 flex items-center justify-center gap-2">
                        <Gift className="w-5 h-5 text-apple-blue" />
                        Espace Fidélité
                    </h3>
                    <div className="relative mb-4">
                        <input 
                            type="tel" 
                            placeholder="N° Téléphone Client"
                            value={scanPhone}
                            onChange={(e) => {
                                setScanPhone(e.target.value);
                                setScanReferral(null);
                                setScanVisits(0);
                                setClientBookings([]);
                            }}
                            className="w-full bg-black border border-white/20 rounded-xl p-4 text-center text-white font-mono text-lg focus:border-apple-blue outline-none pl-10"
                        />
                        <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                    {!scanReferral && (
                        <button 
                            onClick={checkLoyalty}
                            className="w-full py-3 bg-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/20"
                        >
                            Rechercher
                        </button>
                    )}
                </div>

                {/* Results Dashboard */}
                {scanReferral && (
                    <div className="w-full space-y-4 animate-fade-in">
                        
                        {/* 1. Loyalty Card (8th Cut) */}
                        <div className="bg-[#111] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-1">Fidélité Classique</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white font-space">{scanVisits % 8 === 0 && scanVisits > 0 ? 8 : scanVisits % 8}</span>
                                    <span className="text-sm text-white/40 font-space">/ 8</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                                <Star className={`w-5 h-5 ${scanVisits > 0 && scanVisits % 8 === 0 ? 'text-yellow-500 fill-yellow-500 animate-pulse' : 'text-white/20'}`} />
                            </div>
                        </div>

                         {/* 2. Referral Card */}
                         <div className="bg-[#111] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mb-1">Solde Parrainage</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-apple-blue font-space">{scanReferral.creditAmount} €</span>
                                    <span className="text-[10px] text-white/40 font-mono ml-2">DISPONIBLE</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-apple-blue/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-apple-blue" />
                            </div>
                        </div>

                        {/* 3. Actions on Bookings */}
                        {clientBookings.length > 0 && (
                             <div className="text-left bg-[#111] p-4 rounded-2xl border border-white/10">
                                <p className="text-[10px] uppercase text-white/40 mb-3 font-mono tracking-widest">Créneaux éligibles :</p>
                                <div className="space-y-3">
                                    {clientBookings.map(booking => {
                                        const d = getFormattedDate(booking.date);
                                        const isFree = booking.service.price === '0 €';
                                        
                                        return (
                                            <div key={booking.id} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="text-xs text-white font-bold">{d.weekday} {d.day} {d.month} <span className="opacity-50">@ {booking.time}</span></p>
                                                        <p className="text-[10px] text-white/50 font-mono">{booking.service.name}</p>
                                                    </div>
                                                    <span className={`text-xs font-bold ${isFree ? 'text-green-500' : 'text-white'}`}>
                                                        {booking.service.price}
                                                    </span>
                                                </div>

                                                {!isFree && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            disabled={scanReferral.creditAmount === 0}
                                                            onClick={() => handleRedeemReferral(booking.id)}
                                                            className="py-2 px-2 bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue border border-apple-blue/30 rounded-lg text-[9px] font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            Utiliser Solde
                                                        </button>
                                                        <button
                                                            disabled={!(scanVisits > 0 && scanVisits % 8 === 0)}
                                                            onClick={() => handleApplyLoyaltyCut(booking.id)}
                                                            className="py-2 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-lg text-[9px] font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            Offrir 8ème Coupe
                                                        </button>
                                                    </div>
                                                )}
                                                {isFree && (
                                                    <div className="bg-green-500/10 py-1 px-2 rounded flex items-center justify-center gap-1">
                                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                                        <span className="text-[9px] text-green-500 font-bold uppercase">Récompense Appliquée</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {clientBookings.length === 0 && (
                             <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                 <p className="text-xs text-red-400 text-center">Aucun rendez-vous trouvé.</p>
                             </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {view === 'stats' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-[#111] p-6 rounded-2xl border border-white/5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Revenu</span>
                            <h3 className="text-3xl font-space font-bold text-white mt-1">€{estimatedRevenue}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full w-[70%]"></div>
                    </div>
                </div>

                <div className="bg-[#111] p-5 rounded-2xl border border-white/5">
                     <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest block mb-2">Réservations</span>
                     <h3 className="text-2xl font-space font-bold text-white">{totalBookings}</h3>
                </div>
                <div className="bg-[#111] p-5 rounded-2xl border border-white/5">
                     <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest block mb-2">En Attente</span>
                     <h3 className="text-2xl font-space font-bold text-orange-500">{pendingBookings}</h3>
                </div>
            </div>
        )}

        {view === 'schedule' && (
            <div className="space-y-2">
                {currentDateSchedule.slots.map((slot) => {
                    const bookingForThisSlot = dayBookings.find(b => b.time === slot.time);
                    
                    return (
                        <div key={slot.id} className="relative">
                            <div className={`
                                flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-colors relative overflow-hidden
                                ${bookingForThisSlot
                                    ? 'bg-[#151515] border-white/10' 
                                    : !slot.isAvailable 
                                        ? 'bg-red-900/10 border-red-500/20'
                                        : 'bg-black border-white/5'}
                            `}>
                                {!slot.isAvailable && (
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWwyMCAyMCIgc3Ryb2tlPSJyZ2JhKDI1NSwgMCwgMCwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-50 pointer-events-none" />
                                )}

                                <span className={`font-mono text-xs sm:text-sm w-10 sm:w-12 z-10 ${!slot.isAvailable ? 'text-red-500/50' : 'text-white/60'}`}>{slot.time}</span>
                                
                                <div className="flex-1 min-h-[2.5rem] flex flex-col justify-center z-10">
                                    {bookingForThisSlot ? (
                                        <button 
                                            onClick={() => setSelectedBooking(bookingForThisSlot)}
                                            className={`
                                                flex items-center justify-between p-2 sm:p-3 rounded-lg w-full text-left
                                                ${bookingForThisSlot.status === 'confirmed' ? 'bg-apple-blue/20 border border-apple-blue/30' : 
                                                  bookingForThisSlot.status === 'pending' ? 'bg-orange-500/10 border border-orange-500/30' : 
                                                  bookingForThisSlot.status === 'walk-in' ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/5'}
                                            `}
                                        >
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="font-bold text-sm text-white truncate">{bookingForThisSlot.client.firstName} {bookingForThisSlot.client.lastName}</span>
                                                <span className="text-[10px] text-white/50 font-mono truncate">
                                                    {bookingForThisSlot.status === 'walk-in' ? 'Réservation Manuelle' : bookingForThisSlot.service.name}
                                                </span>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
                                                bookingForThisSlot.status === 'confirmed' ? 'bg-apple-blue' : 
                                                bookingForThisSlot.status === 'pending' ? 'bg-orange-500' : 
                                                bookingForThisSlot.status === 'walk-in' ? 'bg-purple-500' : 'bg-red-500'
                                            }`} />
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-between h-full">
                                            <span className={`text-[10px] sm:text-xs uppercase tracking-widest ${!slot.isAvailable ? 'text-red-500' : 'text-white/20'}`}>
                                                {slot.isAvailable ? 'Libre' : 'Bloqué'}
                                            </span>
                                            
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleSlotAvailability(currentDateSchedule.date, slot.id)}
                                                    className={`p-2 rounded-md transition-colors ${!slot.isAvailable ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                                {slot.isAvailable && (
                                                    <button
                                                        onClick={() => {
                                                            setManualSlotId(slot.id);
                                                            setIsManualBookingOpen(true);
                                                        }}
                                                        className="p-2 rounded-md bg-white/5 text-white/40 hover:bg-white text-black transition-colors"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      {isManualBookingOpen && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#111] w-full max-w-sm rounded-xl border border-white/10 p-6 animate-fade-in">
                  <h3 className="text-white font-bold font-space text-lg mb-4">Ajout Rendez-vous Manuel</h3>
                  <form onSubmit={handleCreateWalkIn} className="space-y-4">
                      <div>
                          <label className="text-[10px] text-white/40 uppercase font-mono block mb-2">Nom Client / Description</label>
                          <input 
                              autoFocus
                              type="text" 
                              value={manualName}
                              onChange={(e) => setManualName(e.target.value)}
                              className="w-full bg-black border border-white/20 rounded p-3 text-white focus:border-apple-blue outline-none"
                              placeholder="ex: Client de passage"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                          <button 
                              type="button" 
                              onClick={() => setIsManualBookingOpen(false)}
                              className="py-3 rounded border border-white/10 text-white/60 hover:text-white"
                          >
                              Annuler
                          </button>
                          <button 
                              type="submit" 
                              disabled={!manualName}
                              className={`py-3 rounded font-bold uppercase tracking-wider text-xs ${manualName ? 'bg-white text-black' : 'bg-white/10 text-white/20'}`}
                          >
                              Ajouter
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-[#111] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl animate-slab-entry overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-start bg-[#111]">
                    <div>
                        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest block mb-1">
                            {getFormattedDate(selectedBooking.date).weekday} {getFormattedDate(selectedBooking.date).day} @ {selectedBooking.time}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-space font-bold text-white">
                            {selectedBooking.client.firstName} {selectedBooking.client.lastName}
                        </h2>
                    </div>
                    <button 
                        onClick={() => setSelectedBooking(null)}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
                    <div className="flex items-center justify-between">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                             selectedBooking.status === 'confirmed' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 
                             selectedBooking.status === 'pending' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 
                             selectedBooking.status === 'walk-in' ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                        }`}>
                            {selectedBooking.status === 'confirmed' ? 'Confirmé' : 
                             selectedBooking.status === 'pending' ? 'En Attente' : 
                             selectedBooking.status === 'walk-in' ? 'Passage' : 'Rejeté'}
                        </span>
                        
                        <button 
                            onClick={handleDelete}
                            className="text-red-500 hover:text-red-400 p-2 flex items-center gap-2 text-xs uppercase tracking-wider"
                        >
                            <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                    </div>

                    <div className="space-y-4">
                        {selectedBooking.client.phone && (
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                    <Phone className="w-3 h-3 text-white/60" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Contact</p>
                                    <a href={`tel:${selectedBooking.client.phone}`} className="text-white hover:text-apple-blue transition-colors">
                                        {selectedBooking.client.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                        {/* Status Referral */}
                        {selectedBooking.referrerPhone && (
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-apple-blue/10 flex items-center justify-center shrink-0">
                                    <Zap className="w-3 h-3 text-apple-blue" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider font-mono">Parrainage</p>
                                    <p className="text-white text-sm">
                                        Invité par {selectedBooking.referrerPhone}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-[#151515] border-t border-white/5 grid grid-cols-2 gap-3 mt-auto">
                    <button 
                        onClick={() => handleStatusUpdate('rejected')}
                        className="flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors font-bold text-sm uppercase tracking-wider active:scale-95"
                    >
                        <XCircle className="w-4 h-4" /> Refuser
                    </button>
                    <button 
                        onClick={() => handleStatusUpdate('confirmed')}
                        className="flex items-center justify-center gap-2 py-3 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors font-bold text-sm uppercase tracking-wider active:scale-95 shadow-lg"
                    >
                        <CheckCircle className="w-4 h-4" /> Confirmer
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
