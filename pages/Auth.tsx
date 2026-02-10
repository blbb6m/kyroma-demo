
import React, { useState } from 'react';
import { Camera, Mail, Lock, User as UserIcon, ArrowRight, Loader, ShieldCheck, Briefcase, Inbox } from 'lucide-react';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

interface AuthProps {
  onBack: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
  initialRole?: UserRole;
}

const Auth: React.FC<AuthProps> = ({ onBack, onSuccess, initialMode = 'login', initialRole = UserRole.PHOTOGRAPHER }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  // Ensure we don't accidentally default to DEV role
  const safeInitialRole = initialRole === UserRole.DEV ? UserRole.PHOTOGRAPHER : initialRole;
  const [role, setRole] = useState<UserRole>(safeInitialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckEmail, setIsCheckEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=D4A72C&color=1F1A17&bold=true`
            }
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.user && !data.session) {
          setIsCheckEmail(true);
          setIsLoading(false);
        } else if (data.user && data.session) {
          onSuccess();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        
        if (data.user) {
          onSuccess(); 
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setIsLoading(false); 
      
      if (err.message === 'Invalid login credentials' || err.status === 400) {
        setError('Auth error: Invalid login credentials. Please verify your email and password.');
      } else {
        setError(err.message || 'Authentication failed. Please check your network.');
      }
    }
  };

  if (isCheckEmail) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl border border-black/5 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-5 bg-gold rounded-[2rem] shadow-xl mb-6">
            <Inbox className="h-10 w-10 text-espresso" />
          </div>
          <h2 className="text-4xl font-black text-espresso tracking-tighter italic">Verify Inbox</h2>
          <p className="mt-4 text-sm font-bold text-muted leading-relaxed">
            We've sent an activation link to <span className="text-espresso font-black">{email}</span>. 
            Confirm your email to enter the studio.
          </p>
          <div className="pt-8">
            <button onClick={onBack} className="text-[10px] font-black text-espresso uppercase tracking-[0.2em] border-b-2 border-gold hover:text-gold transition-all">
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl border border-black/5 animate-fade-in-up">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-espresso rounded-2xl shadow-xl mb-6">
            <Camera className="h-8 w-8 text-gold" />
          </div>
          <h2 className="text-4xl font-black text-espresso tracking-tighter">
            {mode === 'login' ? 'Studio Access' : 'Create Identity'}
          </h2>
          <p className="mt-2 text-xs font-bold text-muted uppercase tracking-[0.2em]">
            {mode === 'login' ? 'Enter your visual hub' : 'Join the elite visual marketplace'}
          </p>
        </div>

        {error && (
          <div className="bg-error/5 border border-error/20 p-4 rounded-2xl flex items-center text-error text-xs font-black uppercase tracking-widest leading-relaxed">
            <ShieldCheck className="w-4 h-4 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.PHOTOGRAPHER)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${role === UserRole.PHOTOGRAPHER ? 'border-gold bg-cream/30 shadow-lg' : 'border-gray-100 grayscale opacity-60'}`}
                >
                  <Camera className={`w-6 h-6 mb-2 ${role === UserRole.PHOTOGRAPHER ? 'text-gold' : 'text-muted'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-espresso">Photographer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.EVENT_OWNER)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${role === UserRole.EVENT_OWNER ? 'border-gold bg-cream/30 shadow-lg' : 'border-gray-100 grayscale opacity-60'}`}
                >
                  <Briefcase className={`w-6 h-6 mb-2 ${role === UserRole.EVENT_OWNER ? 'text-gold' : 'text-muted'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-espresso">Planner</span>
                </button>
              </div>

              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold" />
                <input
                  type="text"
                  required
                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-gold transition-all font-bold text-sm"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold" />
              <input
                type="email"
                required
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-gold transition-all font-bold text-sm"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold" />
              <input
                type="password"
                required
                className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-gold transition-all font-bold text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-[1.2rem] text-sm font-black uppercase tracking-widest text-gold bg-espresso hover:bg-[#2A2522] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Enter Studio' : 'Begin Journey'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
            className="text-[10px] font-black text-muted uppercase tracking-[0.2em] hover:text-gold transition-colors"
          >
            {mode === 'login' ? "Establish New Studio" : "Existing Identity? Access Studio"}
          </button>
        </div>

        <button onClick={onBack} className="w-full mt-4 text-[10px] font-black text-espresso/40 uppercase tracking-widest hover:text-espresso transition-colors">
          Return Home
        </button>
      </div>
    </div>
  );
};

export default Auth;
