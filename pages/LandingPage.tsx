
import React from 'react';
import { Camera, Users, Award, ArrowRight, ShieldCheck, Sparkles, Zap, LogIn } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onGetStarted: (role: UserRole, mode: 'login' | 'signup') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-espresso py-12 lg:py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 lg:max-w-2xl lg:w-full lg:py-32 xl:py-48">
            <main className="lg:text-left text-center">
              <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                <Sparkles className="w-4 h-4 text-gold mr-2" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Premium Event Marketplace</span>
              </div>
              <h1 className="text-5xl tracking-tighter font-black text-white sm:text-6xl md:text-7xl leading-[0.9]">
                Elevate your <br />
                <span className="text-gold italic">visual legacy.</span>
              </h1>
              <p className="mt-8 text-lg text-white/60 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Kyroma bridges the gap between premium event planners and world-class local photographers. Seamless handoff. Secure booking. Exceptional results.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <button
                  onClick={() => onGetStarted(UserRole.EVENT_OWNER, 'signup')}
                  className="px-8 py-4 font-black text-espresso bg-gold hover:bg-[#E5B63D] rounded-[1.2rem] shadow-2xl shadow-gold/20 transition-all flex items-center justify-center group"
                >
                  Host an Event <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onGetStarted(UserRole.PHOTOGRAPHER, 'signup')}
                  className="px-8 py-4 font-bold text-white border border-white/20 hover:bg-white/5 rounded-[1.2rem] transition-all flex items-center justify-center"
                >
                  Join as Professional
                </button>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => onGetStarted(UserRole.PHOTOGRAPHER, 'login')}
                  className="inline-flex items-center text-gold hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.3em] group"
                >
                  <LogIn className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" /> 
                  Already a member? <span className="ml-1 underline decoration-gold/40 decoration-2 underline-offset-4">Log In directly</span>
                </button>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 mt-12 lg:mt-0">
          <div className="relative h-96 lg:h-full w-full overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-espresso via-transparent to-transparent z-10 hidden lg:block"></div>
             <img
              className="h-full w-full object-cover grayscale-[20%] hover:scale-105 transition-transform duration-1000"
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80"
              alt="Professional photographer at high-end event"
            />
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-4">The Kyroma Advantage</h2>
            <p className="text-4xl font-black text-espresso tracking-tight sm:text-5xl">
              Professionalism by design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-black/5 hover:shadow-xl hover:-translate-y-2 transition-all">
                <div className="w-14 h-14 bg-espresso rounded-2xl flex items-center justify-center mb-8">
                  <Zap className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-xl font-black text-espresso mb-4">Elite Staffing</h3>
                <p className="text-muted leading-relaxed">
                  Post high-value roles for lead shooters and candids. Manage multiple professionals in one unified event dashboard.
                </p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-black/5 hover:shadow-xl hover:-translate-y-2 transition-all">
                <div className="w-14 h-14 bg-espresso rounded-2xl flex items-center justify-center mb-8">
                  <Camera className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-xl font-black text-espresso mb-4">Secure Delivery</h3>
                <p className="text-muted leading-relaxed">
                  Tier-based hosting ensures your high-res originals are archived for 12 months with professional gallery management.
                </p>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-black/5 hover:shadow-xl hover:-translate-y-2 transition-all">
                <div className="w-14 h-14 bg-espresso rounded-2xl flex items-center justify-center mb-8">
                  <Award className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-xl font-black text-espresso mb-4">Visual Heritage</h3>
                <p className="text-muted leading-relaxed">
                  Support the next generation of pros. Flag events as Open Shoots to allow portfolio-building while leads handle the keys.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
