
import React, { useState } from 'react';
import { useBooking } from '../BookingContext';
import { X, Copy, Check, QrCode } from 'lucide-react';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose }) => {
  const { getReferralBalance } = useBooking();
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const { count, percentage } = phone.length > 9 ? getReferralBalance(phone) : { count: 0, percentage: 0 };
  const referralLink = `${window.location.origin}/?ref=${phone}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden relative animate-slab-entry">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div>
                <h2 className="text-white font-space font-bold text-xl">Programme Ambassadeur</h2>
                <p className="text-xs text-white/40 font-mono mt-1">Invitez des amis, gagnez des coupes.</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
            
            {/* Phone Input */}
            <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono block">Votre numéro</label>
                <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0612345678"
                    className="w-full bg-black border border-white/20 rounded-xl p-4 text-white text-lg font-mono focus:border-apple-blue outline-none transition-colors"
                />
            </div>

            {/* Stats */}
            {phone.length > 9 && (
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
            )}

            {/* Actions */}
            {phone.length > 9 && (
                <div className="space-y-4">
                    {/* Share Link */}
                    <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/5 flex items-center justify-between gap-2">
                        <code className="text-[10px] text-white/60 truncate flex-1 font-mono">
                            darylbarber.com/?ref={phone}
                        </code>
                        <button 
                            onClick={handleCopy}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* QR Code Toggle */}
                    <button 
                        onClick={() => setShowQr(!showQr)}
                        className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <QrCode className="w-4 h-4" />
                        {showQr ? 'Masquer QR' : 'Générer QR Réduction'}
                    </button>
                </div>
            )}
            
            {/* QR Code Display */}
            {showQr && phone.length > 9 && (
                <div className="flex flex-col items-center justify-center pt-4 animate-fade-in">
                    <div className="bg-white p-4 rounded-2xl shadow-2xl">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${phone}&bgcolor=ffffff`}
                            alt="QR Code Parrainage"
                            className="w-40 h-40 mix-blend-multiply"
                        />
                    </div>
                    <p className="text-center text-[10px] text-white/40 mt-4 font-mono max-w-[200px]">
                        Présentez ce code au coiffeur pour valider vos {percentage}% de réduction cumulée.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
