
import React, { useEffect } from 'react';
import { CheckCircle, Info, AlertCircle, X, Sparkles } from 'lucide-react';

export type NotificationType = 'SUCCESS' | 'INFO' | 'ERROR';

interface ToastProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    SUCCESS: {
      bg: 'bg-espresso',
      border: 'border-gold/30',
      text: 'text-white',
      icon: <Sparkles className="w-5 h-5 text-gold" />
    },
    INFO: {
      bg: 'bg-espresso',
      border: 'border-white/10',
      text: 'text-white',
      icon: <Info className="w-5 h-5 text-gold" />
    },
    ERROR: {
      bg: 'bg-error',
      border: 'border-error/20',
      text: 'text-white',
      icon: <AlertCircle className="w-5 h-5 text-white" />
    }
  };

  const current = styles[type];

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none">
      <div className={`pointer-events-auto flex items-start p-5 rounded-[1.5rem] border shadow-2xl backdrop-blur-md animate-fade-in-up ${current.bg} ${current.border}`}>
        <div className="flex-shrink-0 mt-0.5">
          {current.icon}
        </div>
        <div className="ml-4 flex-1">
          <p className={`text-xs font-black uppercase tracking-widest leading-relaxed ${current.text}`}>{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 flex-shrink-0 text-white/30 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
