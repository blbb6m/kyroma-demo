import React from 'react';
import { MapPin, Calendar, Users, Camera, Star, Image as ImageIcon, Sparkles, Bookmark } from 'lucide-react';
import { Event } from '../../types';

interface EventCardProps {
  event: Event;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  onClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isBookmarked, onToggleBookmark, onClick }) => {
  const isPremium = event.roles && event.roles.length > 0;
  const isQuickSaveOpenShoot = event.isOpenShoot && event.openShootApprovalRequired === false;

  // Helper to prevent timezone shifting on date strings
  const parseDate = (d: string) => {
    if (!d) return new Date();
    return d.includes('T') ? new Date(d) : new Date(d.replace(/-/g, '/'));
  };

  const formatDateRange = () => {
    const startDate = parseDate(event.date);
    const startStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    if (event.endDate) {
      const endDate = parseDate(event.endDate);
      const endStr = endDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${startStr} — ${endStr}`;
    }
    return startStr;
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark?.(event.id);
  };

  return (
    <div 
      className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5 overflow-hidden cursor-pointer flex flex-col h-full group relative"
      onClick={() => onClick(event)}
    >
      <div className="relative h-56 w-full overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
        
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <div className={`text-espresso text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl flex items-center uppercase tracking-widest ${isPremium ? 'bg-gold' : 'bg-white/90 backdrop-blur-sm'}`}>
            {isPremium ? <Sparkles className="w-3 h-3 mr-1.5" /> : <Camera className="w-3 h-3 mr-1.5" />}
            {isPremium ? 'Premium' : 'Open Shoot'}
          </div>
        </div>

        {/* Quick Bookmark Toggle for Open Shoots */}
        {isQuickSaveOpenShoot && onToggleBookmark && (
          <button 
            onClick={handleBookmark}
            className={`absolute top-4 left-4 p-2.5 rounded-xl shadow-2xl transition-all active:scale-90 border ${isBookmarked ? 'bg-gold border-gold text-espresso' : 'bg-white/90 backdrop-blur-md border-black/5 text-muted hover:text-gold'}`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="mb-4">
          <div className="flex justify-between items-start">
             <h3 className="text-xl font-black text-espresso tracking-tight line-clamp-1 group-hover:text-gold transition-colors">{event.title}</h3>
          </div>
          <div className="flex items-center text-muted font-bold text-[10px] uppercase tracking-widest mt-2 space-x-4">
            <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-gold" /> {formatDateRange()}</span>
            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-gold" /> {event.location.split(',')[0]}</span>
          </div>
        </div>

        <p className="text-muted text-sm leading-relaxed mb-6 line-clamp-2">{event.description}</p>

        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-espresso uppercase tracking-widest">
                  {isPremium ? `${event.roles.length} Position${event.roles.length !== 1 ? 's' : ''}` : 'Community Access'}
              </span>
              <span className="text-[10px] text-gold font-black uppercase tracking-[0.2em] mt-1">
                  {event.packageType} Tier
              </span>
           </div>
           <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isBookmarked ? 'bg-gold text-espresso rotate-12' : 'bg-cream text-espresso group-hover:bg-gold group-hover:rotate-45'}`}>
              {isBookmarked ? <Bookmark className="w-5 h-5 fill-current" /> : <ImageIcon className="w-5 h-5" />}
           </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;