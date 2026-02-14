import React from 'react';
import { X, Palette, BookOpen, RefreshCw, Users, Monitor, Coffee, Instagram, Mail } from 'lucide-react';
import { GameConfig, Difficulty } from '../types';
import { AI_PROFILES } from '../constants';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  setConfig: (c: GameConfig) => void;
  onReset: () => void;
  onShowRules: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, config, setConfig, onReset, onShowRules }) => {
  const toggleVisual = () => {
    setConfig({ ...config, visualMode: config.visualMode === 'emoji' ? 'simple' : 'emoji' });
  };

  const setMode = (mode: 'pvp' | 'pve') => {
    if (config.mode !== mode) {
        setConfig({ ...config, mode });
        // Don't close immediately so they can pick difficulty if PvE
    }
  };

  const setDifficulty = (difficulty: Difficulty) => {
    setConfig({ ...config, difficulty });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-black text-slate-800">Settings</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="space-y-6 flex-1">
            
            {/* Game Mode Selection */}
            <section>
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Game Mode</p>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setMode('pvp')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${config.mode === 'pvp' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                        <Users className="w-6 h-6 mb-2" />
                        <span className="text-xs font-bold">PvP Local</span>
                    </button>
                    <button 
                        onClick={() => setMode('pve')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${config.mode === 'pve' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                        <Monitor className="w-6 h-6 mb-2" />
                        <span className="text-xs font-bold">Vs Computer</span>
                    </button>
                </div>
            </section>

            {/* Difficulty Selection (Only visible in PvE) */}
            {config.mode === 'pve' && (
                <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Opponent Difficulty</p>
                    <div className="space-y-2">
                        {(Object.entries(AI_PROFILES) as [Difficulty, typeof AI_PROFILES['easy']][]).map(([key, profile]) => (
                            <button
                                key={key}
                                onClick={() => setDifficulty(key)}
                                className={`w-full flex items-center p-3 rounded-xl border-2 transition-all ${config.difficulty === key ? `border-${profile.color.replace('bg-', '')} bg-white shadow-md scale-[1.02]` : 'border-transparent hover:bg-slate-50'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 ${profile.color} text-white`}>
                                    {profile.avatar}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-bold text-slate-800">{profile.name}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">{key}</div>
                                </div>
                                {config.difficulty === key && <div className={`w-3 h-3 rounded-full ${profile.color}`} />}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <hr className="border-slate-100" />

            {/* General Settings */}
            <section className="space-y-3">
                 <button 
                    onClick={toggleVisual}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                    >
                    <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-purple-500" />
                        <span>Visual Style</span>
                    </div>
                    <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200">
                        {config.visualMode === 'emoji' ? 'Emoji' : 'Simple'}
                    </span>
                </button>

                <button 
                    onClick={() => { onShowRules(); onClose(); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                    <BookOpen className="w-5 h-5 text-orange-500" />
                    <span>How to Play</span>
                </button>

                <button 
                    onClick={() => { onReset(); onClose(); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span>Restart Game</span>
                </button>
            </section>

            <hr className="border-slate-100" />

            {/* Support & Connect */}
            <section className="space-y-3">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Support & Connect</p>
                
                <a 
                    href="upi://pay?pa=gantlakumar@fifederal&pn=Puli%20Meka%20Support&cu=INR" 
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-yellow-50 text-yellow-700 font-bold hover:bg-yellow-100 transition-colors"
                >
                    <Coffee className="w-5 h-5" />
                    <div className="text-left">
                        <div className="leading-none">Buy me a Coffee</div>
                        <div className="text-[10px] font-normal mt-1 opacity-80">gantlakumar@fifederal</div>
                    </div>
                </a>

                <a 
                    href="https://instagram.com/ravi_kubera" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-pink-50 text-pink-600 font-bold hover:bg-pink-100 transition-colors"
                >
                    <Instagram className="w-5 h-5" />
                    <span>@ravi_kubera</span>
                </a>

                 <a 
                    href="mailto:gantlaravikumar@gmail.com?subject=Puli%20Meka%20Feedback" 
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-sky-50 text-sky-600 font-bold hover:bg-sky-100 transition-colors"
                >
                    <Mail className="w-5 h-5" />
                    <span>Send Feedback</span>
                </a>
            </section>
          </div>
          
          <div className="text-center text-xs text-slate-300 font-medium mt-6">
            Puli Meka v1.2
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;