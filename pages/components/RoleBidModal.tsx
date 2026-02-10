import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Camera, Zap, Image as ImageIcon, Sparkles } from 'lucide-react';
import { JobRole } from '../../types';

interface RoleBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: JobRole;
  eventTitle: string;
  photoLimit?: number;
  onSubmit: (amount: number, message: string) => void;
  mode: 'PAID' | 'OPEN_SHOOT';
  approvalRequired?: boolean;
}

const RoleBidModal: React.FC<RoleBidModalProps> = ({ isOpen, onClose, role, eventTitle, photoLimit, onSubmit, mode, approvalRequired }) => {
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(mode === 'OPEN_SHOOT' ? 0 : Number(amount), message);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  // Explicit check for false to support instant access labeling
  const isInstantAccess = mode === 'OPEN_SHOOT' && approvalRequired === false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-black/5">
        <div className="px-8 py-6 border-b border-gray-100 bg-cream flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-espresso tracking-tight">
              {mode === 'OPEN_SHOOT' ? (isInstantAccess ? 'Instant Registration' : 'Access Request') : 'Position Brief'}
            </h3>
            <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">
              {mode === 'OPEN_SHOOT' ? eventTitle : `${role?.title} — ${eventTitle}`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-espresso p-2 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {mode === 'PAID' && role && (
            <div className="bg-espresso rounded-2xl p-4 flex items-start text-white shadow-xl">
               <Sparkles className="w-5 h-5 text-gold mt-0.5 mr-3 flex-shrink-0" />
               <div className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                 Planner Budget: <span className="text-gold font-black">${role.minBudget} — ${role.maxBudget}</span>
               </div>
            </div>
          )}
          
          {mode === 'OPEN_SHOOT' && (
             <div className={`rounded-2xl p-4 flex items-start border-2 ${isInstantAccess ? 'bg-green-50 border-green-200 text-green-900' : 'bg-cream border-gold/20 text-espresso'}`}>
               {isInstantAccess ? (
                 <Zap className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
               ) : (
                 <Camera className="w-5 h-5 text-gold mt-0.5 mr-3 flex-shrink-0" />
               )}
               <div className="text-xs font-black uppercase tracking-widest leading-relaxed">
                 {isInstantAccess 
                   ? "Elite Access: Instant approval active. You will be added to the roster immediately upon confirmation."
                   : "Review Required: The lead planner will moderate all entrants. Submit your intent to join the roster."
                 }
               </div>
            </div>
          )}

          {mode === 'PAID' && (
            <div>
              <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">Proposal Rate ($)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-muted font-black text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  className="block w-full pl-9 pr-12 py-3 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-gold focus:outline-none transition-all text-sm font-black"
                  placeholder="Enter your rate"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-espresso uppercase tracking-widest mb-2">
              {mode === 'OPEN_SHOOT' ? 'Creative Intent' : 'Professional Brief'}
            </label>
            <textarea
              required
              rows={4}
              className="block w-full py-3 px-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-gold focus:outline-none transition-all text-sm leading-relaxed"
              placeholder={mode === 'OPEN_SHOOT' ? (isInstantAccess ? "Briefly share your gear or goals (Optional)..." : "Briefly share your goals for this portfolio session...") : "Detail your experience with this event type and your specific visual approach."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl shadow-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${mode === 'OPEN_SHOOT' ? (isInstantAccess ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' : 'bg-gold hover:bg-[#E5B63D] text-espresso shadow-gold/20') : 'bg-espresso hover:bg-[#2A2522] text-gold shadow-espresso/20'}`}
            >
              {isSubmitting ? 'Transmitting...' : mode === 'OPEN_SHOOT' ? (isInstantAccess ? 'Confirm Entrance' : 'Request Approval') : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleBidModal;