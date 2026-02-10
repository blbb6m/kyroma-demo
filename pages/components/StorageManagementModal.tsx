import React, { useState } from 'react';
import { X, HardDrive, Lock, Check, CreditCard, Info, Sparkles } from 'lucide-react';
import { Event, Bid, PhotoPackageType } from '../../types';
import { NotificationType } from '../../components/Toast';

interface StorageManagementModalProps {
  event: Event;
  bids: Bid[];
  onClose: () => void;
  onUpdateStorage: (eventId: string, newLimit: number, newPackage?: PhotoPackageType) => void;
  onNotify: (message: string, type?: NotificationType) => void;
}

const PACKAGES = {
  [PhotoPackageType.BASIC]: { label: 'Basic Event', limit: 100, price: 19, desc: 'Ideal for small social meetups and community events.' },
  [PhotoPackageType.STANDARD]: { label: 'Pro Delivery', limit: 500, price: 49, desc: 'Optimized for corporate parties and social functions.' },
  [PhotoPackageType.PREMIUM]: { label: 'Elite Archival', limit: 2000, price: 99, desc: 'Designed for high-end weddings and large-scale galas.' },
};

const StorageManagementModal: React.FC<StorageManagementModalProps> = ({ event, bids, onClose, onUpdateStorage, onNotify }) => {
  const activeBids = bids.filter(b => b.eventId === event.id && ['PENDING', 'ACCEPTED', 'COUNTERED'].includes(b.status));
  const isLocked = activeBids.length > 0;
  
  const currentUsage = event.submissions?.length || 0;
  const currentPackage = event.packageType;
  
  const [draftPackage, setDraftPackage] = useState(currentPackage);

  // Pricing Logic: Fee applies if not an Open Shoot OR if there are paid roles
  const showPrice = !event.isOpenShoot || event.roles.length > 0;
  const draftTotalPrice = showPrice ? PACKAGES[draftPackage].price : 0;
  const currentTotalPrice = showPrice ? PACKAGES[currentPackage].price : 0;

  const handleApplyChanges = () => {
    if (isLocked) return;
    const newLimit = PACKAGES[draftPackage].limit;
    onUpdateStorage(event.id, newLimit, draftPackage);
    onClose();
  };

  const changePackage = (pkg: PhotoPackageType) => {
    if (isLocked) return;
    if (PACKAGES[pkg].limit < currentUsage) {
      onNotify(`Cannot downgrade to ${PACKAGES[pkg].label}: Current gallery (${currentUsage}) exceeds tier capacity.`, "ERROR");
      return;
    }
    setDraftPackage(pkg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh] border border-white/10">
        {/* Header */}
        <div className="px-10 py-7 border-b border-gray-100 flex justify-between items-center bg-cream">
          <div className="flex items-center">
            <div className="p-3 bg-espresso rounded-2xl mr-4 shadow-xl">
               <HardDrive className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="text-xl font-black text-espresso tracking-tight">Capacity & Handoff</h3>
              <p className="text-[10px] text-muted uppercase font-black tracking-widest">{event.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-espresso transition-colors p-2"><X className="w-7 h-7" /></button>
        </div>

        <div className="p-10 overflow-y-auto space-y-12">
          {isLocked && (
            <div className="bg-espresso rounded-[1.5rem] p-6 flex items-start text-white shadow-2xl">
              <Lock className="w-5 h-5 text-gold mr-4 mt-1" />
              <div>
                <p className="text-sm font-black text-white">Tier Structure Locked</p>
                <p className="text-xs text-white/60 leading-relaxed font-bold mt-1 uppercase tracking-widest">
                  Staffing active. Finalize event participants to modify delivery tiers.
                </p>
              </div>
            </div>
          )}

          {/* Current Status */}
          <section>
            <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mb-4">Live Utilization</h4>
            <div className="bg-cream rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
               <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Gallery Status</p>
                    <div className="text-3xl font-black text-espresso tracking-tighter">
                      delivered <span className="text-gold font-black">{currentUsage}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Active Level</p>
                    <div className="text-xs font-black text-espresso bg-white border border-black/5 px-5 py-2.5 rounded-full shadow-sm">
                      {PACKAGES[currentPackage].label} {showPrice ? `— $${currentTotalPrice}` : ' (Community)'}
                    </div>
                  </div>
               </div>
               <div className="w-full bg-espresso/5 h-4 rounded-full overflow-hidden border border-black/5 shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 bg-gold shadow-[0_0_15px_rgba(212,167,44,0.3)]`} 
                    style={{ width: `${Math.min((currentUsage / PACKAGES[currentPackage].limit) * 100, 100)}%` }}
                  ></div>
               </div>
            </div>
          </section>

          {/* Plan Selection - Now shows for premium hybrid events (Open Shoots with Roles) */}
          {showPrice && (
            <section className={isLocked ? "opacity-30 pointer-events-none grayscale" : ""}>
              <div className="flex items-center justify-between mb-5">
                 <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Handoff Tiers</h4>
                 {draftPackage !== currentPackage && <span className="text-[10px] font-black text-gold flex items-center bg-gold/5 px-4 py-2 rounded-full border border-gold/20 tracking-widest uppercase italic"><Sparkles className="w-3.5 h-3.5 mr-2" /> Upgrade Pending</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                 {Object.entries(PACKAGES).map(([key, pkg]) => (
                    <button 
                      key={key}
                      onClick={() => changePackage(key as PhotoPackageType)}
                      className={`relative p-6 rounded-[2rem] border-2 text-left transition-all active:scale-95 group ${draftPackage === key ? 'border-gold bg-cream/30 shadow-2xl' : 'border-gray-50 bg-white hover:border-gray-100 shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-black text-sm tracking-tight ${draftPackage === key ? 'text-gold' : 'text-espresso'}`}>{pkg.label}</span>
                        {draftPackage === key && <Check className="w-4 h-4 text-gold" />}
                      </div>
                      <p className="text-[10px] text-muted font-black leading-tight mb-8 uppercase tracking-tighter">{pkg.desc}</p>
                      <div className="pt-4 border-t border-gray-50">
                         <span className="text-sm font-black text-espresso">
                           ${pkg.price}
                         </span>
                      </div>
                    </button>
                 ))}
              </div>
            </section>
          )}

          {!showPrice && (
            <div className="bg-cream rounded-[2.5rem] p-8 border border-black/5 flex items-center text-muted font-bold text-xs uppercase tracking-widest">
               <Info className="w-5 h-5 text-gold mr-4" />
               Handoff tiers are managed automatically for community sessions.
            </div>
          )}

          {/* Draft Summary (Bottom Card) */}
          <div className="bg-espresso rounded-[3rem] p-10 text-white flex flex-col sm:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity"><HardDrive className="w-56 h-56" /></div>
             <div className="w-full sm:w-auto relative z-10 text-center sm:text-left">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Projected Handoff Level</p>
                <div className="flex items-center justify-center sm:justify-start">
                    <span className="text-5xl font-black text-white tracking-tighter">{PACKAGES[draftPackage].label}</span>
                    {!showPrice && (
                       <span className="ml-4 bg-gold text-espresso text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-xl">Open Access</span>
                    )}
                </div>
             </div>
             
             <div className="w-full sm:w-auto text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-10 sm:pt-0 sm:pl-16 relative z-10">
                <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Total Hosting Fee</p>
                <div className="text-7xl font-black text-white flex items-center justify-center sm:justify-end tracking-tighter">
                    <span className="text-3xl font-black mr-2 text-white/20">$</span>
                    {draftTotalPrice}
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-cream border-t border-gray-100 flex justify-end space-x-4">
          <button onClick={onClose} className="px-8 py-3.5 border border-black/10 rounded-2xl text-sm font-black text-muted hover:bg-white transition-all uppercase tracking-widest">Cancel</button>
          {!isLocked && showPrice && (
            <button 
              onClick={handleApplyChanges}
              disabled={draftPackage === currentPackage}
              className="px-12 py-3.5 bg-gold text-espresso rounded-2xl text-sm font-black shadow-xl shadow-gold/20 hover:bg-[#E5B63D] transition-all disabled:opacity-50 flex items-center uppercase tracking-widest active:scale-95"
            >
              <CreditCard className="w-5 h-5 mr-3" /> Confirm Plan Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageManagementModal;