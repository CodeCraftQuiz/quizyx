import React from 'react';
import { Advertisement, AdLocation } from '../types';

interface AdProps {
  ad: Advertisement;
  onClose?: () => void;
}

export const AdBanner: React.FC<AdProps> = ({ ad }) => {
  const isImage = ad.content.startsWith('http') || ad.content.startsWith('/');

  return (
    <div className="w-full bg-gray-50 border border-gray-200 p-4 my-4 rounded-lg shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
        <span className="absolute top-0 right-0 bg-gray-200 text-xs px-1 text-gray-500">Sponsored</span>
        <h4 className="font-bold text-lg mb-2">{ad.title}</h4>
        {isImage ? (
            <img src={ad.content} alt={ad.title} className="max-h-32 object-contain" />
        ) : (
            <p className="text-gray-700">{ad.content}</p>
        )}
    </div>
  );
};

export const AdPopup: React.FC<AdProps> = ({ ad, onClose }) => {
    const isImage = ad.content.startsWith('http') || ad.content.startsWith('/');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden relative animate-bounce-in">
        <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10 p-1 bg-white rounded-full"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <div className="bg-blue-600 p-4 text-white text-center">
            <h3 className="text-xl font-bold">{ad.title}</h3>
        </div>
        <div className="p-6 flex flex-col items-center">
            {isImage ? (
                <img src={ad.content} alt={ad.title} className="w-full h-auto rounded-md mb-4" />
            ) : (
                <p className="text-lg text-center mb-6">{ad.content}</p>
            )}
            <button onClick={onClose} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Close Advertisement
            </button>
        </div>
      </div>
    </div>
  );
};