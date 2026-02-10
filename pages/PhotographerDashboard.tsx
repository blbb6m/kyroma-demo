
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Upload, MapPin, Search, Camera, Sparkles, Brain, Target, ShieldCheck, ChevronRight, Zap, Info, Loader, UserCheck, Bookmark, Trash2, XCircle } from 'lucide-react';
import { Event, Bid, User } from '../types';
import { getPortfolioGapAnalysis, PortfolioStrategy } from '../services/geminiInsights';

interface PhotographerDashboardProps {
  events: Event[];
  bids: Bid[];
  bookmarks: string[];
  user: User;
  onUploadPhoto: (eventId: string, files: File[], type: 'OFFICIAL' | 'OPEN_SHOOT') => void;
  onEventClick: (event: Event) => void;
  onBidUpdate: (bidId: string, action: 'ACCEPT_COUNTER' | 'REJECT_COUNTER' | 'WITHDRAW', payload?: { amount?: number }) => void;
  onToggleBookmark: (eventId: string) => void;
}

const PhotographerDashboard: React.FC<PhotographerDashboardProps> = ({ events, bids, bookmarks, user, onUploadPhoto, onEventClick, onBidUpdate, onToggleBookmark }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'bids' | 'strategy'>('schedule');
  const [strategy, setStrategy] = useState<PortfolioStrategy | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

  useEffect(() => {
    if (activeTab === 'strategy' && !strategy) {
      setIsGeneratingStrategy(true);
      getPortfolioGapAnalysis(user, events.filter(e => e.status === 'OPEN')).then(data => {
        setStrategy(data);
        setIsGeneratingStrategy(false);
      });
    }
  }, [activeTab, strategy, user, events]);

  const scheduledItems = useMemo(() => {
    // 1. Get professionally contracted gigs
    const contracted = bids
      .filter(b => b.photographerId === user.id && b.status === 'ACCEPTED')
      .map(b => ({
        type: 'CONTRACTED' as const,
        bid: b,
        event: events.find(e => e.id === b.eventId)
      }));

    // 2. Get bookmarked Open Shoots (Open Access)
    // Filter out events that are already contracted to avoid double-listing
    const bookmarkedOpenAccess = events
      .filter(e => 
        bookmarks.includes(e.id) && 
        e.isOpenShoot && 
        !contracted.some(c => c.event?.id === e.id)
      )
      .map(e => ({
        type: 'BOOKMARKED' as const,
        event: e
      }));

    // Combine and sort chronologically
    return [...contracted, ...bookmarkedOpenAccess]
      .filter(i => i.event && i.event.status !== 'COMPLETED')
      .sort((a, b) => new Date(a.event!.date).getTime() - new Date(b.event!.date).getTime());
  }, [bids, events, user.id, bookmarks]);

  const recommendedEvents = useMemo(() => {
    if (!strategy) return [];
    return events.filter(e => strategy.recommendedEventIds.includes(e.id));
  }, [strategy, events]);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
           <div>
             <h1 className="text-4xl font-black text-espresso tracking-tight">Photographer Studio</h1>
             <p className="text-muted font-bold text-sm uppercase tracking-widest mt-2">Managing your professional visual pipeline</p>
           </div>
        </div>

        <div className="bg-espresso rounded-[2.5rem] p-4 shadow-2xl mb-12">
          <nav className="flex space-x-2">
            {[
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'bids', label: 'Proposals', icon: Clock },
              { id: 'strategy', label: 'Career Strategy', icon: Brain }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex-1 flex items-center justify-center py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === tab.id ? 'bg-gold text-espresso shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8">
          {activeTab === 'schedule' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {scheduledItems.length > 0 ? (
                  scheduledItems.map(item => (
                    <div 
                      key={item.event!.id} 
                      className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden group hover:shadow-2xl transition-all cursor-pointer flex flex-col h-full" 
                      onClick={() => onEventClick(item.event!)}
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img src={item.event!.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute top-4 right-4">
                           {item.type === 'BOOKMARKED' && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); onToggleBookmark(item.event!.id); }}
                               className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-error hover:bg-white transition-all shadow-xl border border-black/5"
                               title="Remove from Schedule"
                             >
                               <XCircle className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="p-8 flex flex-col flex-grow">
                        <div className="flex items-center text-[10px] font-black uppercase text-gold tracking-[0.2em] mb-3">
                          <Calendar className="w-3.5 h-3.5 mr-2" />
                          {new Date(item.event!.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h3 className="text-2xl font-black text-espresso tracking-tight group-hover:text-gold transition-colors">{item.event!.title}</h3>
                        <div className="flex items-center mt-2 text-muted font-bold text-xs">
                          <MapPin className="w-3.5 h-3.5 mr-1.5" /> {item.event!.location.split(',')[0]}
                        </div>
                        
                        <div className="mt-auto pt-8 flex items-center">
                          {item.type === 'CONTRACTED' ? (
                            <div className="flex items-center text-[10px] font-black uppercase text-espresso bg-gold px-4 py-2 rounded-xl shadow-lg">
                              <UserCheck className="w-3.5 h-3.5 mr-2" /> Contract Confirmed
                            </div>
                          ) : (
                            <div className="flex items-center text-[10px] font-black uppercase text-espresso bg-cream border border-black/5 px-4 py-2 rounded-xl shadow-sm">
                              <Bookmark className="w-3.5 h-3.5 mr-2 text-gold fill-current" /> Open Access Reserved
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-40 text-center border-2 border-dashed border-black/5 rounded-[3rem] bg-gray-50/50">
                    <Calendar className="w-16 h-16 text-black/10 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-espresso">Schedule is empty</h3>
                    <p className="text-muted text-sm font-bold uppercase tracking-widest mt-2">Bookmark Open Shoots or accept proposals to populate your studio.</p>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'bids' && (
             <div className="space-y-6">
                {bids.filter(b => b.photographerId === user.id).length > 0 ? (
                  bids.filter(b => b.photographerId === user.id).map(bid => {
                    const event = events.find(e => e.id === bid.eventId);
                    return (
                      <div key={bid.id} className="bg-white p-8 rounded-[2.5rem] border border-black/5 flex items-center justify-between hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-cream flex-shrink-0">
                            {event ? <img src={event.imageUrl} className="w-full h-full object-cover" /> : <Camera className="w-full h-full p-4 text-black/10" />}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-espresso tracking-tight">{event?.title || 'Unknown Event'}</h4>
                            <div className="flex items-center gap-4 mt-1">
                               <span className="text-[10px] font-black text-gold uppercase tracking-widest">{bid.type === 'PAID' ? `Proposal: $${bid.amount}` : 'Open Access Request'}</span>
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                                 bid.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' :
                                 bid.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                 'bg-gray-50 text-gray-500 border-gray-200'
                               }`}>{bid.status}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => event && onEventClick(event)} className="p-3 bg-cream text-espresso rounded-xl hover:bg-gold transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center">
                    <Clock className="w-12 h-12 text-black/10 mx-auto mb-4" />
                    <p className="text-muted font-black text-[10px] uppercase tracking-widest">No active proposals found.</p>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-12 animate-fade-in-up">
              <section className="bg-espresso rounded-[3rem] p-10 text-white relative overflow-hidden border-2 border-gold/20 shadow-2xl">
                 <div className="absolute top-0 right-0 p-12 opacity-5"><Target className="w-64 h-64" /></div>
                 <div className="relative z-10">
                    <div className="flex items-center text-gold mb-8 space-x-3">
                      <Sparkles className="w-6 h-6" />
                      <h2 className="text-xs font-black uppercase tracking-[0.5em]">Portfolio Intelligence Dashboard</h2>
                    </div>
                    
                    {isGeneratingStrategy ? (
                      <div className="py-20 flex flex-col items-center justify-center">
                        <Loader className="w-12 h-12 text-gold animate-spin mb-6" />
                        <p className="text-sm font-black uppercase tracking-widest text-white/40">Analyzing your visual trajectory...</p>
                      </div>
                    ) : strategy ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="space-y-10">
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gold mb-4">Detected Portfolio Gaps</h3>
                            <div className="space-y-4">
                              {strategy.detectedGaps.map(gap => (
                                <div key={gap} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center text-sm font-bold text-white/80">
                                  <Info className="w-4 h-4 mr-3 text-gold" /> {gap}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gold mb-4">Strategic Roadmap</h3>
                            <p className="text-xl font-medium leading-relaxed italic text-white/90">"{strategy.careerRoadmap}"</p>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                           <h3 className="text-sm font-black uppercase tracking-widest text-gold mb-4">Recommended Gigs to Fill Gaps</h3>
                           <div className="space-y-4">
                              {recommendedEvents.map(e => (
                                <div key={e.id} onClick={() => onEventClick(e)} className="bg-white rounded-[2rem] p-6 flex items-center gap-6 cursor-pointer hover:bg-gold/10 transition-all border border-white/5 group">
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                                    <img src={e.imageUrl} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-grow">
                                    <h4 className="text-white font-black text-lg group-hover:text-gold transition-colors">{e.title}</h4>
                                    <span className="text-[9px] font-black text-gold/60 uppercase tracking-widest">Recommended for Gap Closure</span>
                                  </div>
                                  <ChevronRight className="text-white/20" />
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    ) : (
                       <div className="text-center py-20">
                          <p className="text-white/40 font-black uppercase">Update your profile career goals to activate strategy lens.</p>
                       </div>
                    )}
                 </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotographerDashboard;
