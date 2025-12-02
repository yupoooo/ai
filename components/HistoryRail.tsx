import React from 'react';
import { GeneratedImage } from '../types';
import { TrashIcon } from './Icons';

interface HistoryRailProps {
  images: GeneratedImage[];
  onSelect: (image: GeneratedImage) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

const HistoryRail: React.FC<HistoryRailProps> = ({ images, onSelect, onDelete, selectedId }) => {
  if (images.length === 0) return null;

  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 p-4 overflow-x-auto">
      <div className="flex space-x-4">
        {images.map((img) => (
          <div 
            key={img.id} 
            className={`relative group flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedId === img.id ? 'border-indigo-500' : 'border-slate-700 hover:border-slate-500'}`}
            onClick={() => onSelect(img)}
          >
            <img 
              src={img.url} 
              alt={img.prompt} 
              className="w-full h-full object-cover" 
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(img.id);
              }}
              className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryRail;