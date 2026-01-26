
import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { X, ArrowRight } from 'lucide-react';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose }) => {
  const { getReferralBalance, registerAffiliateCode } = useBooking();
  const [phone, setPhone] = useState('');
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Reset state on open
  useEffect(() => {
    if (isOpen) {
        setPhone('');
        setNewCode('');
        setError('');
        setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get data for this phone
  const { count, percentage, code: existingCode } = phone.length > 9 ? getReferralBalance(phone) : { count: 0, percentage: 0, code: null };

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
      <div className="bg-[#111] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden relative animate-slab-entry">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div>
                <h2 className="text-white font-space font-bold text-xl">Programme Ambassadeur</h2>
                <p className="text-xs text-white/40 font-mono mt-1">Gagnez des coupes gratuites.</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
            
            {/* Step 1: Login Phone */}
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono block">Votre numéro</label>
                <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0612345678"
                    disabled={!!existingCode}
                    className={`w-full bg-black border ${existingCode ? 'border-green-500/30 text-green-500' : 'border-white/20 text-white'} rounded-xl p-4 text-lg font-mono focus:border-apple-blue outline-none transition-colors`}
                />
            </div>

            {/* Step 2: Create Code (If no code exists) */}
            {phone.length > 9 && !existingCode && (
                <div className="animate-fade-in space-y-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-sm text-white mb-4">Créez votre code unique à 4 caractères (chiffres ou lettres) pour partager.</p>
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                maxLength={4}
                                value={newCode}
                                onChange={(e) => {
                                    setNewCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                placeholder="CODE"
                                className="flex-1 bg-black border border-white/20 rounded-xl p-3 text-center text-white font-space font-bold uppercase tracking-widest text-xl focus:border-apple-blue outline-none placeholder:text-white/10"
                            />
                            <button 
                                onClick={handleCreateCode}
                                disabled={newCode.length !== 4 || loading}
                                className="bg-white text-black font-bold rounded-xl px-4 disabled:opacity-20 hover:bg-gray-200 transition-colors flex items-center justify-center min-w-[60px]"
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

            {/* Step 3: Dashboard (If code exists) */}
            {existingCode && (
                <div className="animate-fade-in space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                            <span className="text-[10px] text-white/40 uppercase block mb-1">Amis confirmés</span>
                            <span className="text-2xl font-bold text-white font-space">{count}</span>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 relative overflow-hidden">
                            <div 
                                className="absolute inset-0 bg-apple-blue/20 transition-all duration-1000"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                            <div className="relative z-10">
                                <span className="text-[10px] text-white/40 uppercase block mb-1">Réduction</span>
                                <span className="text-2xl font-bold text-apple-blue font-space">{percentage}%</span>
                            </div>
                        </div>
                    </div>

                    {/* My Code Display */}
                    <div className="text-center">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Votre Code Parrain</p>
                        <div className="text-4xl font-black text-white font-space tracking-widest bg-white/5 py-4 rounded-xl border border-white/10 border-dashed">
                            {existingCode}
                        </div>
                        <p className="text-[10px] text-white/30 font-mono mt-4">Partagez ce code avec vos amis pour qu'ils l'utilisent lors de leur réservation.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
