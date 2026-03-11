/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Calculator as CalcIcon, 
  Sparkles, 
  History, 
  Delete, 
  RotateCcw, 
  Equal,
  Plus,
  Minus,
  X,
  Divide,
  ChevronRight,
  Loader2,
  Cpu,
  Copy,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type HistoryItem = {
  expression: string;
  result: string;
  type: 'standard' | 'ai';
  timestamp: number;
};

export default function App() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mode, setMode] = useState<'standard' | 'ai'>('standard');
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useHistoryItem = (item: HistoryItem) => {
    if (item.type === 'standard') {
      setDisplay(item.result);
    } else {
      setAiInput(item.expression);
      setMode('ai');
    }
    setShowHistory(false);
  };

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullExpr = equation + display;
      // Basic safety check for eval (only numbers and operators)
      if (!/^[0-9+\-*/. ]+$/.test(fullExpr.replace(/x/g, '*'))) {
        throw new Error('Invalid');
      }
      
      const result = eval(fullExpr.replace(/x/g, '*')).toString();
      
      const newHistoryItem: HistoryItem = {
        expression: fullExpr,
        result: result,
        type: 'standard',
        timestamp: Date.now()
      };
      
      setHistory([newHistoryItem, ...history].slice(0, 20));
      setDisplay(result);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleAiMath = async () => {
    if (!aiInput.trim()) return;
    
    setIsAiLoading(true);
    try {
      const model = "gemini-3-flash-preview";
      const prompt = `Solve this math problem and provide ONLY the numerical result or a very brief explanation if it's a word problem. Problem: ${aiInput}`;
      
      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
      });

      const result = response.text || "Could not solve";
      
      const newHistoryItem: HistoryItem = {
        expression: aiInput,
        result: result,
        type: 'ai',
        timestamp: Date.now()
      };
      
      setHistory([newHistoryItem, ...history].slice(0, 20));
      setAiInput('');
      setDisplay(result);
    } catch (error) {
      console.error("AI Math Error:", error);
      setDisplay('AI Error');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-calc-bg selection:bg-calc-accent/30">
      <div className="w-full max-w-md relative">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-calc-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/5"
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-bottom border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-calc-accent/20 flex items-center justify-center text-calc-accent">
                <Cpu size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">AI Math Pro</h1>
                <p className="text-[10px] uppercase tracking-widest text-calc-muted font-mono">Precision Engine v2.5</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-calc-accent text-white' : 'hover:bg-white/5 text-calc-muted'}`}
              >
                <History size={18} />
              </button>
            </div>
          </div>

          {/* Display Area */}
          <div className="px-6 py-8 bg-black/20 flex flex-col items-end justify-end min-h-[160px] relative group overflow-hidden">
            <button 
              onClick={() => copyToClipboard(display)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all text-calc-muted hover:text-calc-accent"
              title="Copy result"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            
            <AnimatePresence mode="wait">
              {equation && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-calc-muted font-mono text-sm mb-2"
                >
                  {equation}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div 
              key={display}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-5xl font-mono font-medium tracking-tighter break-all text-right"
            >
              {display}
            </motion.div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-black/30 mx-6 mt-6 rounded-xl border border-white/5">
            <button 
              onClick={() => setMode('standard')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${mode === 'standard' ? 'bg-calc-surface text-white shadow-sm' : 'text-calc-muted hover:text-calc-text'}`}
            >
              <CalcIcon size={14} /> Standard
            </button>
            <button 
              onClick={() => setMode('ai')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-calc-accent text-white shadow-sm' : 'text-calc-muted hover:text-calc-text'}`}
            >
              <Sparkles size={14} /> AI Solver
            </button>
          </div>

          {/* Main Content Area */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {mode === 'standard' ? (
                <motion.div 
                  key="standard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-4 gap-3"
                >
                  <button onClick={clear} className="calc-btn calc-btn-op col-span-2">AC</button>
                  <button onClick={deleteLast} className="calc-btn calc-btn-op"><Delete size={20} /></button>
                  <button onClick={() => handleOperator('/')} className="calc-btn calc-btn-op"><Divide size={20} /></button>
                  
                  {[7, 8, 9].map(n => (
                    <button key={n} onClick={() => handleNumber(n.toString())} className="calc-btn calc-btn-num h-16">{n}</button>
                  ))}
                  <button onClick={() => handleOperator('*')} className="calc-btn calc-btn-op"><X size={20} /></button>
                  
                  {[4, 5, 6].map(n => (
                    <button key={n} onClick={() => handleNumber(n.toString())} className="calc-btn calc-btn-num h-16">{n}</button>
                  ))}
                  <button onClick={() => handleOperator('-')} className="calc-btn calc-btn-op"><Minus size={20} /></button>
                  
                  {[1, 2, 3].map(n => (
                    <button key={n} onClick={() => handleNumber(n.toString())} className="calc-btn calc-btn-num h-16">{n}</button>
                  ))}
                  <button onClick={() => handleOperator('+')} className="calc-btn calc-btn-op"><Plus size={20} /></button>
                  
                  <button onClick={() => handleNumber('0')} className="calc-btn calc-btn-num col-span-2 h-16">0</button>
                  <button onClick={() => handleNumber('.')} className="calc-btn calc-btn-num h-16">.</button>
                  <button onClick={calculate} className="calc-btn calc-btn-action h-16"><Equal size={24} /></button>
                </motion.div>
              ) : (
                <motion.div 
                  key="ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <textarea 
                      ref={aiInputRef}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ask anything... e.g., 'What is the square root of 144 plus 50?'"
                      className="w-full h-32 bg-black/30 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-calc-accent/50 border border-white/5 resize-none placeholder:text-calc-muted"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-calc-muted uppercase">
                      Powered by Gemini
                    </div>
                  </div>
                  <button 
                    onClick={handleAiMath}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="w-full py-4 rounded-2xl bg-calc-accent text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-calc-accent/20"
                  >
                    {isAiLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>Solve with AI <ChevronRight size={18} /></>
                    )}
                  </button>
                  
                  <div className="p-4 rounded-xl bg-calc-accent/5 border border-calc-accent/10">
                    <p className="text-[11px] text-calc-muted leading-relaxed">
                      <span className="text-calc-accent font-bold">PRO TIP:</span> You can ask complex word problems, unit conversions, or multi-step equations.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* History Sidebar/Overlay */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed top-0 right-0 h-full w-full max-w-xs bg-calc-surface z-50 shadow-2xl border-l border-white/5 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">History</h2>
                  <button onClick={() => setHistory([])} className="text-xs text-calc-muted hover:text-red-400 transition-colors flex items-center gap-1">
                    <RotateCcw size={12} /> Clear All
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-calc-muted opacity-50">
                      <History size={48} strokeWidth={1} className="mb-4" />
                      <p className="text-sm">No calculations yet</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.timestamp} className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2 group relative">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-calc-muted uppercase tracking-tighter">
                            {item.type === 'ai' ? 'AI Solver' : 'Standard'}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => copyToClipboard(item.result)}
                              className="p-1.5 rounded-md hover:bg-white/5 text-calc-muted hover:text-calc-accent"
                              title="Copy result"
                            >
                              <Copy size={10} />
                            </button>
                            <button 
                              onClick={() => useHistoryItem(item)}
                              className="p-1.5 rounded-md hover:bg-white/5 text-calc-muted hover:text-calc-accent"
                              title="Use this"
                            >
                              <ArrowUpRight size={10} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-calc-muted truncate mb-1">{item.expression}</p>
                          <p className="text-base font-mono font-medium text-calc-text break-all">
                            {item.result}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <button 
                  onClick={() => setShowHistory(false)}
                  className="mt-6 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  Close History
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
