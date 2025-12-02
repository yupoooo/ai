import React, { useState, useEffect } from 'react';
import { GeneratedImage, AppMode, AspectRatio } from './types';
import { generateImageFromText, editImageWithText, fileToBase64 } from './services/gemini';
import { LoaderIcon, UploadIcon, ImageIcon, WandIcon, DownloadIcon, TrashIcon } from './components/Icons';
import HistoryRail from './components/HistoryRail';

const ASPECT_RATIOS: AspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

export default function App() {
  const [mode, setMode] = useState<AppMode>('create');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Edit mode specific state
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lumina_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('lumina_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (mode === 'edit' && !sourceImage) {
      setError("Please upload an image to edit first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let imageUrl = '';
      if (mode === 'create') {
        imageUrl = await generateImageFromText(prompt, aspectRatio);
      } else {
        // Edit mode
        if (sourceImage) {
           imageUrl = await editImageWithText(sourceImage, prompt, aspectRatio);
        }
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt,
        type: mode,
        timestamp: Date.now(),
        originalImage: mode === 'edit' ? sourceImage! : undefined
      };

      setHistory(prev => [newImage, ...prev]);
      setSelectedImage(newImage);
      setPrompt(''); 
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message || "Something went wrong. Please try again.");
        } else {
            setError("An unknown error occurred.");
        }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setSourceImage(base64);
        setError(null);
      } catch (e) {
        setError("Failed to read file.");
      }
    }
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900 justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <WandIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Lumina AI
          </h1>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setMode('create')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'create' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'edit' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Edit
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar / Controls */}
        <aside className="w-full md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col p-6 overflow-y-auto">
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-slate-100">
              {mode === 'create' ? 'Generate Image' : 'Edit Image'}
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {mode === 'create' 
                ? 'Describe the image you want to see in detail. The more specific you are, the better the result.'
                : 'Upload an image and describe how you want to modify it.'}
            </p>

            {mode === 'edit' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Source Image</label>
                <div className="relative group">
                    {sourceImage ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                            <img src={sourceImage} alt="Source" className="w-full h-full object-contain" />
                             <button 
                                onClick={() => setSourceImage(null)}
                                className="absolute top-2 right-2 bg-black/70 hover:bg-red-500/90 p-1.5 rounded-full text-white transition-colors"
                             >
                                <TrashIcon className="w-4 h-4" />
                             </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadIcon className="w-10 h-10 text-slate-500 mb-3" />
                                <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-indigo-400">Click to upload</span></p>
                                <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </label>
                    )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">
                Prompt
              </label>
              <textarea
                id="prompt"
                rows={mode === 'edit' ? 3 : 5}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                placeholder={mode === 'create' ? "A futuristic city floating in the clouds, cyberpunk style..." : "Add a red hat to the person..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-2 py-2 rounded-md text-xs font-medium border transition-all ${
                                aspectRatio === ratio
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim() || (mode === 'edit' && !sourceImage)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="w-5 h-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <WandIcon className="w-5 h-5" />
                  <span>{mode === 'create' ? 'Generate' : 'Edit Image'}</span>
                </>
              )}
            </button>
            
            {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
                    {error}
                </div>
            )}
          </div>
          
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-slate-950 flex flex-col relative">
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            {selectedImage ? (
                <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden group">
                    <img 
                        src={selectedImage.url} 
                        alt={selectedImage.prompt} 
                        className="max-w-full max-h-[80vh] object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                         <div className="text-white">
                             <p className="font-medium line-clamp-1">{selectedImage.prompt}</p>
                             <p className="text-xs text-slate-400">{new Date(selectedImage.timestamp).toLocaleTimeString()}</p>
                         </div>
                         <button 
                            onClick={() => downloadImage(selectedImage.url, `lumina-${selectedImage.id}.png`)}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-colors text-white"
                            title="Download"
                         >
                             <DownloadIcon className="w-5 h-5" />
                         </button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-600 max-w-md">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="w-10 h-10 opacity-50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Create</h3>
                    <p className="text-sm">Select a mode and enter a prompt to get started. Your generated art will appear here.</p>
                </div>
            )}
          </div>

          {/* History Rail */}
          <HistoryRail 
            images={history} 
            onSelect={setSelectedImage} 
            onDelete={handleDelete}
            selectedId={selectedImage?.id || null}
          />
        </main>
      </div>
    </div>
  );
}