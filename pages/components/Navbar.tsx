
import React from 'react';
import { Camera, LogOut, Menu, ArrowLeftRight, Terminal, ShieldAlert, LogIn, UserPlus } from 'lucide-react';
import { User, UserRole } from '../../types';

interface NavbarProps {
  currentUser: User | null;
  onLogin: () => void;
  onSignUp: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onToggleRole?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogin, onSignUp, onLogout, onNavigate, currentPage, onToggleRole }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isDev = currentUser?.role === UserRole.DEV;
  const isDashboardActive = currentPage === 'dashboard' || currentPage === 'photographer-dashboard' || currentPage === 'dev-dashboard';

  const handleLogoClick = () => {
    if (currentUser) {
      if (isDev) onNavigate('dev-dashboard');
      else onNavigate('dashboard');
    } else {
      onNavigate('home');
    }
  };

  return (
    <nav className={`${isDev ? 'bg-[#0A0A0B] border-[#00FF41]/20' : 'bg-espresso border-white/10'} border-b sticky top-0 z-50 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
            <div className={`${isDev ? 'bg-[#00FF41]' : 'bg-gold'} p-1.5 rounded-lg mr-2.5 shadow-lg`}>
              {isDev ? <Terminal className="h-5 w-5 text-black" strokeWidth={3} /> : <Camera className="h-5 w-5 text-espresso" strokeWidth={2.5} />}
            </div>
            <span className={`text-2xl font-black tracking-tighter uppercase italic ${isDev ? 'text-[#00FF41]' : 'text-white'}`}>Kyroma</span>
            {isDev && <span className="ml-3 text-[10px] font-black bg-[#00FF41]/10 text-[#00FF41] px-2 py-0.5 rounded border border-[#00FF41]/20 tracking-widest uppercase">Command Center</span>}
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {currentUser ? (
              <>
                {isDev ? (
                  <button
                    onClick={() => onNavigate('dev-dashboard')}
                    className={`flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                      currentPage === 'dev-dashboard' ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'text-[#00FF41] border-[#00FF41]/40 hover:bg-[#00FF41]/10'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 mr-2" /> Admin Studio
                  </button>
                ) : (
                  currentUser.role === UserRole.PHOTOGRAPHER && (
                    <button
                      onClick={() => onNavigate('marketplace')}
                      className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
                        currentPage === 'marketplace' ? 'text-gold' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Find Events
                    </button>
                  )
                )}

                <button
                  onClick={() => onNavigate(isDev ? 'dev-dashboard' : 'dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-bold transition-all ${
                    isDashboardActive ? (isDev ? 'text-[#00FF41]' : 'text-gold') : 'text-white/70 hover:text-white'
                  }`}
                >
                  {isDev ? 'Event Registry' : (currentUser.role === UserRole.EVENT_OWNER ? 'My Events' : 'Dashboard')}
                </button>

                {!isDev && (
                  <button
                    onClick={onToggleRole}
                    className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full hover:bg-white/10 transition-all group"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-gold group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Switch to {currentUser.role === UserRole.PHOTOGRAPHER ? 'Planner' : 'Photographer'}
                    </span>
                  </button>
                )}

                <div className="flex items-center ml-4 space-x-2">
                  <div 
                    className={`flex items-center space-x-3 cursor-pointer p-1.5 rounded-xl transition-all ${isDev ? 'hover:bg-[#00FF41]/5' : 'hover:bg-white/5'}`}
                    onClick={() => onNavigate('my-profile')}
                  >
                    <div className="text-right hidden lg:block">
                      <div className="text-sm font-bold text-white">{currentUser.name}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${isDev ? 'text-[#00FF41]' : 'text-gold'}`}>
                        {isDev ? 'Admin' : (currentUser.role === UserRole.PHOTOGRAPHER ? 'Photographer' : 'Planner')}
                      </div>
                    </div>
                    <img
                      src={currentUser.avatarUrl}
                      alt="Profile"
                      className={`h-9 w-9 rounded-full border-2 object-cover ${isDev ? 'border-[#00FF41]/30' : 'border-gold/30'}`}
                    />
                  </div>
                  <button onClick={onLogout} className={`p-2 rounded-full transition-all ${isDev ? 'text-[#00FF41]/50 hover:text-[#00FF41]' : 'text-white/50 hover:text-white'}`}>
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={onLogin}
                  className="px-5 py-2 text-sm font-bold text-white border border-white/20 hover:bg-white/5 rounded-xl transition-all flex items-center"
                >
                  <LogIn className="w-4 h-4 mr-2 text-gold" /> Log In
                </button>
                <button
                  onClick={onSignUp} 
                  className="px-5 py-2 text-sm font-black text-espresso bg-gold hover:bg-[#E5B63D] rounded-xl shadow-lg shadow-gold/10 transition-all flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Join the Community
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-white/70 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className={`md:hidden border-t animate-fade-in-up ${isDev ? 'bg-[#0A0A0B] border-[#00FF41]/20' : 'bg-espresso border-white/10'}`}>
          <div className="px-4 pt-4 pb-6 space-y-2">
            {currentUser ? (
              <>
                <div className={`p-3 flex items-center space-x-3 rounded-2xl ${isDev ? 'bg-[#00FF41]/5' : 'bg-white/5'}`}>
                  <img src={currentUser.avatarUrl} alt="" className={`h-10 w-10 rounded-full border ${isDev ? 'border-[#00FF41]/30' : 'border-gold/30'}`} />
                  <div>
                    <div className="text-base font-bold text-white">{currentUser.name}</div>
                    <div className={`text-xs font-black uppercase tracking-widest ${isDev ? 'text-[#00FF41]' : 'text-gold'}`}>{isDev ? 'Admin' : currentUser.role}</div>
                  </div>
                </div>
                
                {!isDev && (
                  <button
                    onClick={() => { onToggleRole?.(); setIsMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-gold hover:bg-white/5"
                  >
                    Switch to {currentUser.role === UserRole.PHOTOGRAPHER ? 'Planner' : 'Photographer'}
                  </button>
                )}

                <button
                  onClick={() => { onNavigate(isDev ? 'dev-dashboard' : 'dashboard'); setIsMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-white/80 hover:bg-white/5"
                >
                  {isDev ? 'Admin Command Center' : 'Dashboard'}
                </button>
                <button
                  onClick={() => { onLogout(); setIsMenuOpen(false); }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-error hover:bg-error/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-3">
                 <button
                  onClick={() => { onLogin(); setIsMenuOpen(false); }}
                  className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white border border-white/20"
                >
                  Log In
                </button>
                <button
                  onClick={() => { onSignUp(); setIsMenuOpen(false); }}
                  className="block w-full text-center px-4 py-3 rounded-xl text-base font-black text-espresso bg-gold"
                >
                  Join the Community
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
