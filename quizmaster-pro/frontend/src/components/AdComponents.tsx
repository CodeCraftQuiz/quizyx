
import React from 'react';
import { Advertisement } from '../types';

interface AdProps {
  ad: Advertisement;
  onNavigateToScam?: () => void;
  onClose?: () => void;
}

export const AdBanner: React.FC<AdProps> = ({ ad, onNavigateToScam }) => {
  const isImage = ad.content.startsWith('http') || ad.content.startsWith('/');

  return (
    <div className="w-full bg-surface border border-primary/20 p-2 my-6 rounded-quizyx shadow-fuchsia flex flex-col items-center justify-center relative overflow-hidden group">
        <span className="absolute top-1 right-2 text-[8px] font-black uppercase text-white/20 tracking-tighter italic">Sponsored Protocol</span>
        <h4 className="font-black text-white text-xs mb-1 uppercase italic tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">{ad.title}</h4>
        <div onClick={onNavigateToScam} className="cursor-pointer w-full">
            {isImage ? (
                <img src={ad.content} alt={ad.title} className="max-h-24 w-full object-cover rounded-lg group-hover:scale-[1.02] transition-transform" />
            ) : (
                <p className="text-white/60 text-sm font-bold p-4 text-center">{ad.content}</p>
            )}
        </div>
    </div>
  );
};

export const AdPopup: React.FC<AdProps> = ({ ad, onNavigateToScam, onClose }) => {
    const isImage = ad.content.startsWith('http') || ad.content.startsWith('/');
    
    return (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-pop-in">
            <div className="bg-surface border-2 border-primary/50 rounded-quizyx-lg shadow-fuchsia max-w-lg w-full overflow-hidden relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/20 hover:text-primary z-20 transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="bg-primary p-6 text-white text-center">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">{ad.title}</h3>
                </div>

                <div className="p-10 flex flex-col items-center">
                    <div onClick={onNavigateToScam} className="cursor-pointer w-full group">
                        {isImage ? (
                            <img src={ad.content} alt={ad.title} className="w-full h-auto rounded-quizyx mb-8 shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform" />
                        ) : (
                            <p className="text-xl text-center text-white font-black italic mb-10 leading-tight tracking-tight">{ad.content}</p>
                        )}
                        
                        <button className="w-full py-6 bg-primary text-white rounded-quizyx font-black uppercase italic tracking-widest shadow-fuchsia hover:bg-secondary hover:text-dark transition-all active:scale-95 text-lg">
                            ODBIERZ DOSTĘP
                        </button>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="mt-6 text-[10px] text-white/20 font-black uppercase tracking-widest hover:text-white transition-colors italic"
                    >
                        Ignoruj transmisję
                    </button>
                </div>
            </div>
        </div>
    );
};
