
import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { X, ArrowRight, Ticket, Users, Coins } from 'lucide-react';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose }) => {
  const { getReferralBalance, registerAffiliateCode } = useBooking();
  
  // State for View Navigation
  const [showIntro, setShowIntro] = useState(true);
  
  // State for Logic
  const [phone, setPhone] = useState('');
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Reset state on open
  useEffect(() => {
    if (isOpen) {
        setShowIntro(true);
        setPhone('');
        setNewCode('');
        setError('');
        setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get data for this phone
  const { count, creditAmount, code: existingCode } = phone.length > 9 ? getReferralBalance(phone) : { count: 0, creditAmount: 0, code: null };

  const handleCreateCode = async () => {
      if (newCode.length !== 4) {
          setError("Le code doit faire 4 caractères exacts.");
          return;
      }
      
      setLoading(true);
      setError('');
      
      try {
          const success = await registerAffiliateCode(phone, newCode);
          if (!success) {
              setError("Ce code est déjà pris ou une erreur est survenue.");
          }
      } catch (e) {
          setError("Erreur de connexion.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden relative animate-slab-entry flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111] z-10">
            <div>
                <h2 className="text-white font-space font-bold text-xl">Ambassadeur</h2>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 -mr-2">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content Container */}
        <div className="overflow-y-auto custom-scrollbar">
            
            {/* VIEW 1: INTRO / EXPLAINER */}
            {showIntro ? (
                <div className="p-6 space-y-8 animate-fade-in">
                    <div className="space-y-6">
                        {/* Feature 1 */}
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                <Ticket className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">Crée ton Code</h3>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    Génère ton code unique à 4 caractères (ex: <span className="text-white font-mono">LUC4</span>) en quelques secondes.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                <Users className="w-5 h-5 text-apple-blue" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">Partage à tes Potes</h3>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    Donne ton code à tes amis. Ils l'utilisent lors de leur réservation.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                <Coins className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm mb-1">Gagne du Cash</h3>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    Tu reçois <span className="text-white font-bold">3 € de crédit</span> pour chaque coupe effectuée avec ton code.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button 
                            onClick={() => setShowIntro(false)}
                            className="w-full py-4 bg-white text-black font-space font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-gray-200 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            Rejoindre le Programme <ArrowRight className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onClick={() => setShowIntro(false)}
                            className="w-full py-3 text-xs font-mono uppercase tracking-wider text-white/40 hover:text-white transition-colors"
                        >
                            Déjà membre ? Voir mon solde
                        </button>
                    </div>
                </div>
            ) : (
                /* VIEW 2: LOGIN / DASHBOARD */
                <div className="p-6 space-y-8 animate-slide-up">
                    
                    {/* Login Step */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono block">Votre numéro de téléphone</label>
                        <input 
                            type="tel" 
                            autoFocus
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0612345678"
                            disabled={!!existingCode}
                            className={`w-full bg-black border ${existingCode ? 'border-green-500/30 text-green-500' : 'border-white/20 text-white'} rounded-xl p-4 text-lg font-mono focus:border-apple-blue outline-none transition-colors`}
                        />
                    </div>

                    {/* Create Code Step (If no code exists) */}
                    {phone.length > 9 && !existingCode && (
                        <div className="animate-fade-in space-y-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-sm text-white mb-4">Choisissez votre code parrain :</p>
                                <div className="flex gap-2 w-full">
                                     <input 
                                        type="text" 
                                        maxLength={4}
                                        value={newCode}
                                        onChange={(e) => {
                                            setNewCode(e.target.value.toUpperCase());
                                            setError('');
                                        }}
                                        placeholder="CODE"
                                        className="flex-1 min-w-0 bg-black border border-white/20 rounded-xl p-3 text-center text-white font-space font-bold uppercase tracking-widest text-xl focus:border-apple-blue outline-none placeholder:text-white/10"
                                    />
                                    <button 
                                        onClick={handleCreateCode}
                                        disabled={newCode.length !== 4 || loading}
                                        className="bg-white text-black font-bold rounded-xl w-14 shrink-0 disabled:opacity-20 hover:bg-gray-200 transition-colors flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <ArrowRight className="w-6 h-6" />
                                        )}
                                    </button>
                                </div>
                                {error && <p className="text-red-500 text-xs mt-2 font-mono">{error}</p>}
                            </div>
                        </div>
                    )}

                    {/* Dashboard Step (If code exists) */}
                    {existingCode && (
                        <div className="animate-fade-in space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                                    <span className="text-[10px] text-white/40 uppercase block mb-1">Amis confirmés</span>
                                    <span className="text-2xl font-bold text-white font-space">{count}</span>
                                </div>
                                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <span className="text-[10px] text-white/40 uppercase block mb-1">Cagnotte</span>
                                        <span className="text-2xl font-bold text-apple-blue font-space">{creditAmount} €</span>
                                    </div>
                                </div>
                            </div>

                            {/* My Code Display */}
                            <div className="text-center">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Votre Code Parrain</p>
                                <div className="text-4xl font-black text-white font-space tracking-widest bg-white/5 py-4 rounded-xl border border-white/10 border-dashed select-all">
                                    {existingCode}
                                </div>
                                <p className="text-[10px] text-white/30 font-mono mt-4">
                                    Partagez ce code. Dès qu'un ami réserve avec, vous gagnez <span className="text-apple-blue">3 €</span>.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
