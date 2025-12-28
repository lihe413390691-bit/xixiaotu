
import React, { useState } from 'react';
import { generateStoryboard } from './services/geminiService';
import { StoryboardResponse } from './types';
import ShotCard from './components/ShotCard';

const App: React.FC = () => {
  const [plot, setPlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StoryboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!plot.trim()) {
      setError("请先输入剧情内容。");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const storyboard = await generateStoryboard(plot);
      setResult(storyboard);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成失败，可能是由于剧情过于复杂导致超时。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 selection:bg-amber-500/30">
      {/* Header Nav */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1a1a1a] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-xl serif-font shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            D
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white uppercase">专业分镜大师</h1>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase italic">Cinematic Storyboard Suite</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 mt-12">
        {!result && (
          <div className="flex flex-col items-center justify-center text-center space-y-12 py-20">
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-bold text-white serif-font tracking-tight leading-tight">
                视界 <br />
                <span className="text-amber-500 italic">工业级动画分镜</span>
              </h2>
              <p className="max-w-2xl text-gray-500 text-lg leading-relaxed mx-auto font-light">
                基于 Gemini 3 Pro 深度导演思维。支持全中文叙事解析、光影参数生成及 Sora 高清提示词方案。
              </p>
            </div>
            
            <div className="w-full max-w-4xl bg-[#111] p-1 rounded-[2.5rem] border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="bg-[#0a0a0a] rounded-[2.2rem] p-8 space-y-6">
                <textarea
                  value={plot}
                  onChange={(e) => setPlot(e.target.value)}
                  placeholder="粘贴您的剧情内容，例如：第一集 1-1：大雨中的古庙..."
                  className="w-full h-64 bg-transparent border-none text-white text-lg focus:ring-0 transition-all resize-none placeholder-gray-800 font-light leading-relaxed"
                />
                <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-6">
                  <div className="flex gap-4">
                    <span className="text-[10px] text-gray-600 font-mono tracking-widest uppercase flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Gemini 3 Pro 就绪
                    </span>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`px-12 py-4 rounded-full font-bold text-black uppercase tracking-widest transition-all ${
                      loading 
                      ? 'bg-amber-800 cursor-wait scale-95 opacity-50' 
                      : 'bg-amber-500 hover:bg-white hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                    }`}
                  >
                    {loading ? '导演正在深度构思中...' : '开始生成专业分镜表'}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-4 px-8 pb-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 text-xs text-center font-bold uppercase tracking-widest">
                    错误: {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-[#222] pb-12">
              <div className="space-y-2">
                <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">电影级核心策划 / CINEMATIC PLAN</span>
                <h3 className="text-5xl font-bold text-white serif-font tracking-tight">视觉核心概念</h3>
                <p className="text-gray-300 italic max-w-2xl text-base leading-relaxed mt-4 bg-white/5 p-6 rounded-2xl border border-white/5">{result.keyVisualConcept}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setResult(null)}
                  className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-400 hover:bg-white hover:text-black transition-all"
                >
                  重置脚本
                </button>
              </div>
            </div>

            <div className="space-y-12">
              {result.groups && result.groups.length > 0 ? (
                result.groups.map((group, idx) => (
                  <ShotCard key={idx} group={group} />
                ))
              ) : (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-dashed border-[#222]">
                  <p className="text-gray-500 italic">未能生成分镜数据，请精简剧情后重试。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <div className="w-32 h-32 mb-10 relative">
              <div className="absolute inset-0 border-4 border-amber-500/10 rounded-full scale-110"></div>
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-amber-500/40 text-[10px] uppercase">AI 构思</div>
            </div>
            <h3 className="text-amber-500 font-bold uppercase tracking-[0.6em] mb-4 text-xl">导演正在深度构思镜头</h3>
            <p className="text-gray-400 text-sm max-w-md italic leading-relaxed">
              正在调用 Gemini 3 Pro 规划视觉逻辑、设计光影意境并生成专业全中文描述，此过程大约需要 15-30 秒...
            </p>
          </div>
        )}
      </main>

      <footer className="mt-40 border-t border-[#1a1a1a] py-20 text-center">
        <p className="text-gray-800 text-[9px] uppercase tracking-[1em] font-black">
          专业动画分镜大师版 &copy; 2025
        </p>
      </footer>
    </div>
  );
};

export default App;
