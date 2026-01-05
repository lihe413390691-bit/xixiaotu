
import { ShotGroup, Comment, AnimationShot } from '../types';
import React, { useState } from 'react';

interface ShotCardProps { 
  group: ShotGroup; 
  currentUser: { name: string, role: string };
  onAddComment: (shotNo: string, text: string) => void;
}

const ShotCard: React.FC<ShotCardProps> = ({ group, currentUser, onAddComment }) => {
  const [activeCommentShot, setActiveCommentShot] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [copiedShot, setCopiedShot] = useState<string | null>(null);

  const handleSubmitComment = (shotNo: string) => {
    if (!commentText.trim()) return;
    onAddComment(shotNo, commentText);
    setCommentText('');
    setActiveCommentShot(null);
  };

  const handleCopy = (text: string, shotNo: string) => {
    navigator.clipboard.writeText(text);
    setCopiedShot(shotNo);
    setTimeout(() => setCopiedShot(null), 2000);
  };

  return (
    <div className="mb-16 bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all hover:border-amber-500/10">
      <div className="bg-[#111] p-8 border-b border-white/5 relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]"></div>
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase rounded-full tracking-widest shadow-lg shadow-amber-500/20">工业分镜组</span>
              <h2 className="text-3xl font-bold text-white serif-font tracking-tight">{group.eventTitle}</h2>
            </div>
            
            {/* 场景资产标记区 - 已修复显示全量内容 */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
                  <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">核心场景: {group.sceneName}</span>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 font-light italic leading-relaxed">
                <span className="text-gray-600 font-black mr-2 uppercase tracking-tighter not-italic">底图参考:</span> 
                {group.scenePrompt}
              </div>
            </div>
          </div>
          <div className="flex -space-x-2 pt-1">
            {[1,2,3].map(i => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-[#111] bg-amber-500/20 flex items-center justify-center text-[11px] text-amber-500 font-bold shadow-xl">U{i}</div>
            ))}
          </div>
        </div>
        <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
          <div className="text-[10px] text-amber-500/60 font-black uppercase mb-3 tracking-[0.4em] italic flex items-center gap-2">
            <span className="w-1 h-3 bg-amber-500/40 rounded-full"></span> 叙事动力学推理 / NARRATIVE ANALYSIS
          </div>
          <p className="text-sm text-gray-400 leading-relaxed italic whitespace-pre-wrap font-light">{group.reasoning}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1350px]">
          <thead className="bg-[#0f0f0f] text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">
            <tr>
              <th className="p-8 border-b border-white/5 w-24 text-center">镜号</th>
              <th className="p-8 border-b border-white/5 w-24 text-center">时长</th>
              <th className="p-8 border-b border-white/5 w-1/4">动态演化 (△ 强效标注)</th>
              <th className="p-8 border-b border-white/5 w-56">对白与内心独白</th>
              <th className="p-8 border-b border-white/5 w-1/5">绘画资产 (资产锁定)</th>
              <th className="p-8 border-b border-white/5 w-1/3">SORA 工业生成指令</th>
              <th className="p-8 border-b border-white/5 w-44 text-center">协作反馈</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {group.shots.map((shot, idx) => {
              const hasMandatoryCmd = shot.action.includes('△') || shot.action.includes('指令');
              
              return (
                <React.Fragment key={idx}>
                  <tr className={`align-top group hover:bg-white/[0.03] transition-all border-b border-white/5 ${hasMandatoryCmd ? 'bg-amber-500/[0.02]' : ''}`}>
                    <td className="p-8 font-mono text-amber-500 font-black text-center border-r border-white/5 opacity-50 group-hover:opacity-100">{shot.shotNo}</td>
                    <td className="p-8 font-mono text-gray-500 text-center border-r border-white/5">10.0秒</td>
                    <td className="p-8">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {hasMandatoryCmd && (
                            <span className="text-[9px] px-2.5 py-1 bg-amber-500 text-black font-black rounded-lg uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                              △ 核心工业指令
                            </span>
                          )}
                          <span className="text-[9px] px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20 uppercase tracking-tighter">帧对齐优化 ✓</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed font-light whitespace-pre-wrap text-[14px]">{renderRichText(shot.action)}</p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="text-[9px] px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20 uppercase font-bold tracking-widest">{shot.lighting}</span>
                          <span className="text-[9px] px-2 py-1 bg-white/5 text-gray-500 rounded-md border border-white/10 uppercase font-mono">{shot.tone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8 border-r border-white/5">
                      {shot.audio ? (
                        <div className="bg-rose-500/[0.04] p-5 rounded-3xl border border-rose-500/10 shadow-inner relative group/audio">
                          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                          <div className="text-[8px] text-rose-500/60 uppercase font-black mb-3 tracking-[0.2em]">语音分镜脚本:</div>
                          <p className="text-rose-100 font-serif leading-relaxed whitespace-pre-wrap italic text-[14px]">
                            {renderDialogue(shot.audio)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-gray-800 italic text-[10px] uppercase font-black tracking-widest py-6 border-2 border-dashed border-white/5 rounded-3xl text-center">静默转场</div>
                      )}
                    </td>
                    <td className="p-8">
                      <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-[13px] text-gray-400 leading-relaxed hover:border-amber-500/30 transition-all select-all shadow-2xl">
                        {renderRichText(shot.imagePrompt)}
                      </div>
                    </td>
                    <td className="p-8 relative">
                      <div className="bg-blue-500/[0.03] p-7 rounded-[2rem] border border-blue-500/10 text-[13px] text-blue-100/80 leading-relaxed hover:border-blue-500/40 transition-all shadow-2xl min-h-[220px] font-light">
                        <button 
                          onClick={() => handleCopy(shot.videoPrompt, shot.shotNo)}
                          className="absolute top-10 right-10 opacity-0 group-hover:opacity-100 bg-amber-500 text-black px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all z-10 shadow-xl hover:scale-105 active:scale-95"
                        >
                          {copiedShot === shot.shotNo ? '已存入剪贴板' : '复制 SORA 指令'}
                        </button>
                        <div className="whitespace-pre-wrap pr-10">
                          {renderVideoPrompt(shot.videoPrompt)}
                        </div>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <button 
                        onClick={() => setActiveCommentShot(activeCommentShot === shot.shotNo ? null : shot.shotNo)}
                        className="group relative inline-flex flex-col items-center gap-2 px-8 py-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-amber-500 hover:text-black transition-all shadow-2xl"
                      >
                        <span className="text-2xl filter drop-shadow-md">💬</span>
                        <span className="text-[11px] font-black uppercase tracking-tighter">{shot.comments?.length || 0} 条专业评审</span>
                      </button>
                    </td>
                  </tr>
                  {activeCommentShot === shot.shotNo && (
                    <tr>
                      <td colSpan={7} className="bg-black/80 border-b border-white/10 p-12 animate-in fade-in slide-in-from-top-6 duration-700">
                        <div className="max-w-5xl mx-auto space-y-10">
                          <div className="flex justify-between items-center border-b border-white/5 pb-8">
                            <h4 className="text-amber-500 font-black uppercase tracking-[0.5em] text-sm flex items-center gap-4">
                              <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span> 导演工业协作讨论区
                            </h4>
                            <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] text-gray-400 uppercase font-mono border border-white/10 italic">协同者: {currentUser.name} 🎬 {currentUser.role}</div>
                          </div>
                          <div className="space-y-6 max-h-[450px] overflow-y-auto pr-8 custom-scrollbar">
                            {shot.comments && shot.comments.length > 0 ? (
                              shot.comments.map((c) => (
                                <div key={c.id} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] flex gap-6 hover:border-amber-500/20 transition-all group/msg">
                                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black font-black text-lg shadow-2xl group-hover/msg:scale-110 transition-transform">
                                    {c.userName.charAt(0)}
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-black text-white text-sm uppercase tracking-wider">{c.userName} <span className="text-amber-500/40 font-normal ml-3">/ {c.userRole}</span></span>
                                      <span className="text-[10px] text-gray-600 font-mono italic">{new Date(c.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-gray-300 text-[15px] leading-relaxed font-light">{c.text}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">
                                <p className="text-gray-700 italic text-base font-light tracking-widest">暂无工业评审意见。请针对转场对齐、物理反馈或资产逻辑提出建议。</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-6 mt-10">
                            <input 
                              type="text" 
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(shot.shotNo)}
                              placeholder="键入您的工业级评审建议..."
                              className="flex-1 bg-black/50 border border-white/10 rounded-[2rem] px-8 py-5 text-base text-white focus:border-amber-500/50 outline-none transition-all shadow-2xl placeholder:text-gray-800"
                            />
                            <button onClick={() => handleSubmitComment(shot.shotNo)} className="px-12 py-5 bg-amber-500 text-black font-black rounded-[2rem] text-[11px] uppercase shadow-2xl shadow-amber-500/30 hover:bg-white hover:scale-105 transition-all">发布评审意见</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>{`
        @keyframes amber-pulse {
          0%, 100% { 
            color: #f59e0b; 
            text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
            transform: scale(1);
          }
          50% { 
            color: #fbbf24; 
            text-shadow: 0 0 25px rgba(251, 191, 36, 0.9);
            transform: scale(1.05);
          }
        }
        .animate-amber-pulse {
          display: inline-block;
          animation: amber-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
};

const renderVideoPrompt = (text: string) => {
  if (!text) return null;
  const timeTags = ['[0-3s]', '[3-7s]', '[7-10s]', '[0-3秒]', '[3-7秒]', '[7-10秒]'];
  const lines = text.split('\n');
  
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const hasTag = timeTags.some(tag => trimmed.includes(tag));
    const isSystemBlock = trimmed.startsWith('【系统音') || trimmed.startsWith('【主线任务');
    const hasDialogue = (trimmed.includes('“') && trimmed.includes('”')) || trimmed.includes('对白') || trimmed.includes('内心独白');
    
    return (
      <div 
        key={i} 
        className={`
          mb-3 leading-relaxed
          ${hasTag ? 'mt-8 font-black text-amber-500 border-l-[6px] border-amber-500 pl-5 bg-amber-500/10 py-3 rounded-r-xl uppercase tracking-tighter' : ''}
          ${isSystemBlock ? 'mt-8 bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-emerald-400 font-bold shadow-lg shadow-emerald-500/5' : ''}
          ${hasDialogue ? 'text-rose-200 font-medium italic bg-rose-500/5 px-4 py-2 border-l-[3px] border-rose-500 rounded-sm my-2' : ''}
          ${!hasTag && !isSystemBlock && !hasDialogue ? 'text-gray-400 pl-2 opacity-80' : ''}
        `}
      >
        {line}
      </div>
    );
  });
};

const renderDialogue = (text: string) => {
  if (!text) return null;
  const isOS = text.toUpperCase().includes('OS') || text.includes('内心独白');
  const dialogueRegex = /^([^(（]+)([（(][^）)]+[）)])[:：\s]*(.*)$/;
  const match = text.match(dialogueRegex);
  
  if (match) {
    return (
      <span className="block">
        <span className={`${isOS ? 'text-blue-400' : 'text-rose-400'} font-black not-italic uppercase tracking-[0.2em] text-[12px]`}>{match[1]}</span>
        <span className="text-amber-500/50 text-[11px] not-italic ml-3 font-mono">[{match[2]}]</span>
        <span className="block mt-3 text-gray-100 not-italic border-l-2 border-rose-500/40 pl-5 font-light text-[15px] leading-relaxed tracking-wide">
          {isOS && <span className="text-[10px] bg-blue-500/30 text-blue-400 px-2 py-0.5 rounded-md mr-3 font-black uppercase tracking-widest">内心独白</span>}
          “{match[3]}”
        </span>
      </span>
    );
  }
  return (
    <span>
      {isOS && <span className="text-[10px] bg-blue-500/30 text-blue-400 px-2 py-0.5 rounded-md mr-3 font-black uppercase tracking-widest">内心独白</span>}
      “{text}”
    </span>
  );
};

const renderRichText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|【.*?】|\[\[.*?\]\]|△.*?[\n\s,，])|△/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('△')) {
      return (
        <span key={i} className="text-amber-500 font-black text-base drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-pulse inline-block mr-1">
          {part}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="text-amber-400 font-bold underline decoration-amber-500/30 underline-offset-4">{part.replace(/\*\*/g, '')}</span>;
    }
    if (part.startsWith('【') && part.endsWith('】')) {
      return (
        <span key={i} className="px-2.5 py-1 mx-1 bg-amber-500 text-black font-black text-[12px] rounded-lg shadow-[0_6px_15px_rgba(245,158,11,0.5)] border border-amber-300 transform hover:scale-110 transition-transform inline-block">
          {part}
        </span>
      );
    }
    if (part.startsWith('[[') && part.endsWith(']]')) {
      return (
        <span key={i} className="animate-amber-pulse px-1 mx-0.5 italic">
          {part.replace(/[\[\]]/g, '')}
        </span>
      );
    }
    return <span key={i} className="opacity-95">{part}</span>;
  });
};

export default ShotCard;
