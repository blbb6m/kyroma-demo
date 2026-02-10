import React, { useState } from 'react';
import { Plus, Users, Calendar, DollarSign, Image as ImageIcon, HardDrive, UserCheck, ShieldCheck, Clock, CheckCircle, Lock, Settings } from 'lucide-react';
import { Event, Bid, User, PhotoPackageType } from '../types';
import BidReviewModal from './components/BidReviewModal';
import GalleryModal from './components/GalleryModal';
import StorageManagementModal from './components/StorageManagementModal';
import { NotificationType } from '../components/Toast';

interface OwnerDashboardProps {
  events: Event[];
  bids: Bid[];
  user: User;
  onCreateEvent: () => void;
  onEventClick: (event: Event) => void;
  onBidUpdate: (bidId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', payload?: { reason?: string; amount?: number }) => void;
  onPhotographerClick: (photographerId: string) => void;
  onNotify: (message: string, type?: NotificationType) => void;
  onUpdateStorage: (eventId: string, newLimit: number, newPackage?: PhotoPackageType) => void;
  onDeletePhoto: (eventId: string, photoId: string) => void;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ events, bids, user, onCreateEvent, onEventClick, onBidUpdate, onPhotographerClick, onNotify, onUpdateStorage, onDeletePhoto }) => {
  const [selectedGalleryEvent, setSelectedGalleryEvent] = useState<Event | null>(null);
  const [selectedStorageEvent, setSelectedStorageEvent] = useState<Event | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const myEvents = events.filter(e => e.ownerId === user.id);
  const upcomingEvents = myEvents.filter(e => e.status !== 'COMPLETED');
  const archivedEvents = myEvents.filter(e => e.status === 'COMPLETED');
  const activeBidsCount = bids.filter(b => (b.status === 'PENDING' || b.status === 'COUNTERED') && myEvents.some(e => e.id === b.eventId)).length;

  const handleReviewClick = (bid: Bid) => { setSelectedBid(bid); setIsReviewModalOpen(true); };

  const handleBidAction = (action: 'ACCEPT' | 'REJECT' | 'COUNTER', payload?: { reason?: string; amount?: number }) => {
    if (selectedBid) {
      onBidUpdate(selectedBid.id, action, payload);
      setIsReviewModalOpen(false);
      setSelectedBid(null);
    }
  };

  const parseDate = (d: string) => {
    if (!d) return new Date();
    return d.includes('T') ? new Date(d) : new Date(d.replace(/-/g, '/'));
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-espresso tracking-tight">Executive Studio</h1>
            <p className="text-muted font-bold text-sm uppercase tracking-widest mt-2">Managing your premium event visuals</p>
          </div>
          <button onClick={onCreateEvent} className="inline-flex items-center px-8 py-3.5 bg-gold text-espresso rounded-2xl text-sm font-black hover:bg-[#E5B63D] transition-all shadow-xl shadow-gold/10 active:scale-95 uppercase tracking-widest">
            <Plus className="-ml-1 mr-2 h-5 w-5" /> Host New Event
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-16">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 flex items-center shadow-sm">
            <div className="p-3 bg-espresso rounded-2xl mr-5 shadow-lg"><Calendar className="h-6 w-6 text-gold" /></div>
            <div><p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Active Gigs</p><p className="text-2xl font-black text-espresso">{upcomingEvents.length}</p></div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 flex items-center shadow-sm">
            <div className="p-3 bg-espresso rounded-2xl mr-5 shadow-lg"><DollarSign className="h-6 w-6 text-gold" /></div>
            <div><p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Applications</p><p className="text-2xl font-black text-espresso">{activeBidsCount}</p></div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 flex items-center shadow-sm">
            <div className="p-3 bg-espresso rounded-2xl mr-5 shadow-lg"><Users className="h-6 w-6 text-gold" /></div>
            <div><p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Visual Legacy</p><p className="text-2xl font-black text-espresso">{archivedEvents.length}</p></div>
          </div>
        </div>

        <div className="space-y-10">
          <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] border-b border-black/5 pb-4">Upcoming Event Roster</h2>
          {upcomingEvents.map(event => {
            const allEventBids = bids.filter(b => b.eventId === event.id && b.status !== 'REJECTED' && b.status !== 'WITHDRAWN');
            const hiredBids = allEventBids.filter(b => b.status === 'ACCEPTED');
            const pendingBids = allEventBids.filter(b => b.status === 'PENDING' || b.status === 'COUNTERED');
            const hasActiveBidsForLock = bids.some(b => b.eventId === event.id && ['PENDING', 'ACCEPTED', 'COUNTERED'].includes(b.status));
            const usageCount = event.submissions?.length || 0;
            const limit = event.photoLimit || 25;
            const usagePercent = Math.min((usageCount / limit) * 100, 100);
            const isFullyStaffed = event.roles.every(r => r.filled);

            return (
              <div key={event.id} className="bg-white shadow-sm rounded-[2.5rem] border border-black/5 overflow-hidden hover:shadow-xl transition-all">
                <div className="px-8 py-7 bg-white border-b border-black/5 flex justify-between items-center">
                   <div>
                     <div className="flex items-center space-x-3">
                       <h3 className="text-2xl font-black text-espresso tracking-tight">{event.title}</h3>
                       {isFullyStaffed && (
                         <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-espresso text-gold uppercase tracking-widest shadow-xl">
                           <ShieldCheck className="w-3 h-3 mr-1.5" /> Elite Team Formed
                         </span>
                       )}
                     </div>
                     <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">{event.location.split(',')[0]} &bull; {parseDate(event.date).toLocaleDateString()}</p>
                   </div>
                   <div className="flex space-x-3">
                     <button onClick={() => setSelectedGalleryEvent(event)} className="px-6 py-2.5 bg-espresso text-white rounded-xl text-xs font-black hover:bg-[#2A2522] transition-all flex items-center uppercase tracking-widest shadow-lg active:scale-95">
                        <ImageIcon className="w-4 h-4 mr-2 text-gold" /> Vault
                     </button>
                     <button onClick={() => onEventClick(event)} className="px-6 py-2.5 bg-cream border border-black/10 rounded-xl text-xs font-black text-espresso hover:bg-white transition-all uppercase tracking-widest shadow-sm active:scale-95">Details</button>
                   </div>
                </div>
                
                <div className="px-8 py-5 border-b border-black/5 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center w-full sm:w-1/2">
                        <div className="p-2 bg-cream rounded-lg mr-4"><HardDrive className="w-4 h-4 text-espresso" /></div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1.5 items-end">
                              <span className="text-[9px] font-black text-muted uppercase tracking-widest">Delivered: {usageCount} Visuals</span>
                              <span className="text-[9px] font-black text-gold uppercase tracking-widest italic">{event.packageType} Tier</span>
                            </div>
                            <div className="w-full bg-espresso/5 h-2 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-error' : 'bg-gold'}`} style={{ width: `${usagePercent}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end w-full sm:w-auto">
                        <button 
                          onClick={() => setSelectedStorageEvent(event)}
                          className="flex items-center px-5 py-2.5 bg-white border border-black/10 rounded-xl text-espresso font-black text-[10px] uppercase tracking-[0.2em] hover:border-gold hover:text-gold transition-all active:scale-95 shadow-sm"
                        >
                          {hasActiveBidsForLock ? <Lock className="w-3.5 h-3.5 mr-2 text-gold" /> : <Settings className="w-3.5 h-3.5 mr-2" />}
                          Tiers & Handoff
                        </button>
                    </div>
                </div>

                <div className="p-0">
                    {hiredBids.length > 0 && (
                      <div className="border-b border-black/5">
                        <div className="px-8 py-3 bg-cream/30 border-b border-black/5 flex items-center text-[9px] font-black text-espresso/40 uppercase tracking-[0.3em]">
                          <UserCheck className="w-3.5 h-3.5 mr-2" /> Contracted Professionals
                        </div>
                        <ul className="divide-y divide-black/5">
                          {hiredBids.map(bid => (
                            <li key={bid.id} className="px-8 py-5 flex items-center justify-between hover:bg-cream/20 transition-all">
                              <div className="flex items-center cursor-pointer group" onClick={() => onPhotographerClick(bid.photographerId)}>
                                  <div className="relative">
                                    <div className="h-12 w-12 rounded-full bg-espresso flex items-center justify-center text-gold font-black mr-4 border-2 border-gold/20 overflow-hidden shadow-xl group-hover:scale-105 transition-transform">
                                      {(bid.photographerName || 'P').charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-gold text-espresso rounded-full p-0.5 border-2 border-white shadow-sm">
                                      <ShieldCheck className="w-3 h-3" />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-espresso group-hover:text-gold transition-colors">{bid.photographerName}</p>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">
                                      {event.roles.find(r => r.id === bid.roleId)?.title || (bid.type === 'PAID' ? 'Lead' : 'Open Shoot')} &bull; ${bid.amount} Agreement
                                    </p>
                                  </div>
                              </div>
                              <div className="flex items-center text-gold text-[10px] font-black uppercase tracking-widest bg-espresso px-4 py-2 rounded-xl shadow-xl">
                                <CheckCircle className="w-3.5 h-3.5 mr-2" /> Booking Secure
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="px-8 py-3 bg-white border-b border-black/5 flex items-center text-[9px] font-black text-muted uppercase tracking-[0.3em]">
                      <Clock className="w-3.5 h-3.5 mr-2" /> Active Proposals
                    </div>
                    {pendingBids.length > 0 ? (
                      <ul className="divide-y divide-black/5">
                        {pendingBids.map(bid => (
                          <li key={bid.id} className="px-8 py-5 flex items-center justify-between hover:bg-cream/10 transition-all">
                            <div className="flex items-center cursor-pointer group" onClick={() => onPhotographerClick(bid.photographerId)}>
                                <div className="h-12 w-12 rounded-full bg-cream flex items-center justify-center text-espresso font-black mr-4 border border-black/5 group-hover:border-gold transition-all">
                                  {(bid.photographerName || 'P').charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-espresso group-hover:text-gold transition-colors">{bid.photographerName}</p>
                                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">
                                    {bid.type === 'OPEN_SHOOT' ? 'Open Shoot Intent' : `Proposed: $${bid.amount}`}
                                  </p>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={() => handleReviewClick(bid)} className="px-5 py-2 border border-black/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cream transition-all shadow-sm">Review Brief</button>
                                <button onClick={() => onBidUpdate(bid.id, 'ACCEPT')} className="px-5 py-2 bg-espresso text-gold rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2A2522] transition-all shadow-xl active:scale-95">Accept</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-8 py-10 text-center bg-white/50">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest italic">Monitoring marketplace for applications...</p>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedGalleryEvent && (
        <GalleryModal 
            event={selectedGalleryEvent} 
            onClose={() => setSelectedGalleryEvent(null)} 
            onDeletePhoto={(photoId) => onDeletePhoto(selectedGalleryEvent.id, photoId)}
            isOwner={true}
        />
      )}
      {selectedStorageEvent && (
        <StorageManagementModal
          event={selectedStorageEvent}
          bids={bids}
          onClose={() => setSelectedStorageEvent(null)}
          onUpdateStorage={(eventId, limit, pkg) => {
            onUpdateStorage(eventId, limit, pkg);
            onNotify("Visual handoff tiers updated.", "SUCCESS");
          }}
          onNotify={onNotify}
        />
      )}
      {selectedBid && <BidReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} bid={selectedBid} onAction={handleBidAction} />}
    </div>
  );
};

export default OwnerDashboard;