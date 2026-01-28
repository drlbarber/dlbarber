import React from 'react';
import { X, Shield, FileText, Server, Database } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111] w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden relative animate-slab-entry flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111] z-10 shrink-0">
            <h2 className="text-white font-space font-bold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-apple-blue" />
                Mentions Légales
            </h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2 -mr-2">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar p-6 space-y-8 text-white/80 font-sans text-sm leading-relaxed">
            
            {/* 1. Éditeur */}
            <section>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-white/50" />
                    1. Éditeur du Site
                </h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1 text-xs sm:text-sm">
                    <p><strong className="text-white">Dénomination :</strong> Daryl Barber</p>
                    <p><strong className="text-white">Statut :</strong> Entreprise Individuelle (EI)</p>
                    <p><strong className="text-white">Adresse :</strong> [VOTRE ADRESSE POSTALE ICI]</p>
                    <p><strong className="text-white">SIRET :</strong> [VOTRE NUMÉRO SIRET ICI]</p>
                    <p><strong className="text-white">Téléphone :</strong> 06 11 58 49 79</p>
                    <p><strong className="text-white">Email :</strong> [VOTRE EMAIL ICI]</p>
                    <p><strong className="text-white">Directeur de la publication :</strong> Daryl [NOM]</p>
                </div>
            </section>

            {/* 2. Hébergeur */}
            <section>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-base">
                    <Server className="w-4 h-4 text-white/50" />
                    2. Hébergement
                </h3>
                <p className="text-xs text-white/60 mb-2">
                    Le site est hébergé par :
                </p>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs sm:text-sm">
                    <p><strong className="text-white">Hébergeur :</strong> Netlify, Inc.</p>
                    <p><strong className="text-white">Adresse :</strong> 2325 3rd Street, Suite 215, San Francisco, California 94107, USA.</p>
                    <p><strong className="text-white">Site web :</strong> www.netlify.com</p>
                </div>
            </section>

            {/* 3. Données Personnelles (RGPD) */}
            <section>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-base">
                    <Database className="w-4 h-4 text-white/50" />
                    3. Politique de Confidentialité (RGPD)
                </h3>
                <div className="space-y-4">
                    <p>
                        Conformément au Règlement Général sur la Protection des Données (RGPD), Daryl Barber s'engage à protéger la confidentialité des utilisateurs.
                    </p>
                    
                    <div className="pl-4 border-l-2 border-apple-blue/50 space-y-2">
                        <p><strong className="text-white">Données collectées :</strong> Nom, Prénom, Numéro de téléphone.</p>
                        <p><strong className="text-white">Finalité :</strong> Gestion des rendez-vous, envoi de SMS de confirmation, et programme de fidélité.</p>
                        <p><strong className="text-white">Conservation :</strong> Les données sont conservées pour une durée de 3 ans après le dernier contact.</p>
                        <p><strong className="text-white">Vos Droits :</strong> Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour l'exercer, contactez-nous par téléphone ou email.</p>
                    </div>

                    <p className="text-xs text-white/50 bg-black/50 p-3 rounded-lg">
                        <strong className="text-white">Cookies & LocalStorage :</strong> Ce site n'utilise pas de cookies publicitaires tiers. Il utilise le stockage local de votre appareil pour mémoriser votre connexion (Admin) ou vos préférences d'affichage.
                    </p>
                </div>
            </section>

            {/* 4. Propriété Intellectuelle */}
            <section>
                <h3 className="text-white font-bold mb-2 text-base">4. Propriété Intellectuelle</h3>
                <p>
                    L'ensemble de ce site (design, images, textes, logo) relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Toute reproduction est interdite sans autorisation.
                </p>
            </section>

        </div>
      </div>
    </div>
  );
};