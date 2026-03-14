/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Loader2, 
  AlertCircle, 
  Key, 
  Maximize2,
  Settings2,
  History
} from 'lucide-react';
import { generateImage, ImageSize, AspectRatio } from './services/geminiService';

// Extend window interface for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [size, setSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    } catch (err) {
      console.error('Error checking API key:', err);
      setHasApiKey(false);
    }
  };

  const handleOpenKeySelector = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success and proceed as per instructions
      setHasApiKey(true);
    } catch (err) {
      console.error('Error opening key selector:', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const imageUrl = await generateImage({ prompt, size, aspectRatio });
      setResultImage(imageUrl);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now()
      };
      setHistory(prev => [newImage, ...prev].slice(0, 10));
    } catch (err: any) {
      console.error('Generation error:', err);
      if (err.message?.includes('Requested entity was not found')) {
        setHasApiKey(false);
        setError('API Key session expired. Please select your key again.');
      } else {
        setError(err.message || 'Failed to generate image. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#141414] border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">API Key Required</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            To use the high-quality Gemini 3.1 Flash Image model, you need to select a paid API key from your Google Cloud project.
          </p>
          <button
            onClick={handleOpenKeySelector}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            Select API Key
          </button>
          <p className="mt-6 text-xs text-zinc-500">
            Learn more about <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Gemini API billing</a>.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-emerald-500/30 font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">x9raju <span className="text-emerald-500">creator</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">Powered by Gemini 3.1</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setHasApiKey(false)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
              title="Change API Key"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              <span>Prompt</span>
            </div>
            <form onSubmit={handleGenerate} className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with neon lights and flying cars, cinematic lighting, 8k..."
                className="w-full h-40 bg-[#111] border border-white/10 rounded-2xl p-5 text-lg resize-none focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 group-hover:border-white/20"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="absolute bottom-4 right-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-emerald-900/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                {(['1K', '2K', '4K', '512px'] as ImageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                      size === s 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-[#111] border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {(['1:1', '16:9', '9:16', '4:3'] as AspectRatio[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                      aspectRatio === r 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-[#111] border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {history.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
                <History className="w-4 h-4" />
                <span>Recent Generations</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {history.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setResultImage(img.url)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      resultImage === img.url ? 'border-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-32">
            <div className="aspect-square w-full bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden relative flex items-center justify-center group shadow-2xl">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <Sparkles className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-zinc-500 font-medium animate-pulse">Dreaming up your image...</p>
                  </motion.div>
                ) : resultImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full relative"
                  >
                    <img 
                      src={resultImage} 
                      alt="Generated result" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button 
                        onClick={() => downloadImage(resultImage, `x9raju-${Date.now()}.png`)}
                        className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl"
                        title="Download"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => window.open(resultImage, '_blank')}
                        className="p-4 bg-white/10 text-white rounded-full hover:scale-110 transition-transform backdrop-blur-md border border-white/20"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-12"
                  >
                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <ImageIcon className="w-12 h-12 text-zinc-700" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-400 mb-2">Ready to create?</h3>
                    <p className="text-zinc-600 max-w-xs mx-auto">Enter a prompt on the left to generate your first masterpiece.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {resultImage && !isGenerating && (
              <div className="mt-6 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-400">Generated successfully</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-white/5">{size}</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 border border-white/5">{aspectRatio}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-sm">
          <p>© 2026 x9raju image creator. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
