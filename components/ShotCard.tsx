
import React, { useState } from 'react';
import { ShotGroup, Comment, AnimationShot } from '../types';

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
    <div className="mb-16 bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-[#1a1a1a] p-6 border-b border-[#333]">
        <div className="flex items-center gap-4 mb-3">
          <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded">核心分镜组</span>
          <h2 className="text-xl font-bold text-white serif-font">{group.eventTitle}</h2>
        </div>
        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-amber-500 font-bold uppercase mb-2">导演视角：10s 三帧动力学与 OS 推理 / CINEMATIC DIRECTING</div>
          <p className="text-sm text-gray-300 leading-relaxed italic whitespace-pre-wrap">{group.reasoning}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead className="bg-[#161616] text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-4 border-b border-[#222] w-20 text-center">镜号</th>
              <th className="p-4 border-b border-[#222] w-24 text-center">时长</th>
              <th className="p-4 border-b border-[#222] w-1/4">动态演化 (震撼/空景/衔接)</th>
              <th className="p-4 border-b border-[#222] w-48">100% 剧本原文 (含 OS)</th>
              <th className="p-4 border-b border-[#222] w-1/5">绘画提示词 (【】资产锁死)</th>
              <th className="p-4 border-b border-[#222] w-1/3">10s 三帧关联推理 (音画同步)</th>
              <th className="p-4 border-b border-[#222] w-40 text-center">评审</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {group.shots.map((shot, idx) => {
              const isEpic = shot.action.includes('震撼') || shot.action.includes('冲击') || shot.lighting.includes('震撼');
              const isEmpty = shot.action.includes('空景') || shot.action.includes('空镜头');
              
              return (
                <React.Fragment key={idx}>
                  <tr className={`align-top hover:bg-white/[0.02] transition-colors border-b border-[#1a1a1a] ${isEpic ? 'bg-amber-500/[0.03]' : ''}`}>
                    <td className="p-4 font-mono text-amber-500 font-bold text-center border-r border-[#1a1a1a]">{shot.shotNo}</td>
                    <td className="p-4 font-mono text-gray-300 text-center border-r border-[#1a1a1a]">{shot.duration}</td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {isEpic && <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-black font-black rounded uppercase animate-pulse">震撼镜头</span>}
                          {isEmpty && <span className="text-[9px] px-1.5 py-0.5 bg-gray-600 text-white font-black rounded uppercase">空景转场</span>}
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-900/20 text-blue-400 rounded border border-blue-900/30 uppercase tracking-tighter">动力学衔接✓</span>
                        </div>
                        <p className="text-gray-200 leading-relaxed font-light">{renderRichText(shot.action)}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/20 text-purple-400 rounded border border-purple-900/30 uppercase">{shot.lighting}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded border border-white/10 uppercase">{shot.tone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-[#1a1a1a]">
                      {shot.audio ? (
                        <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                          <div className="text-[9px] text-red-400/50 uppercase font-black mb-1">剧本原文执行:</div>
                          <p className="text-red-200/90 italic leading-relaxed whitespace-pre-wrap font-serif">
                            {renderDialogue(shot.audio)}
                          </p>
                          {shot.soundEffects && (
                            <div className="mt-2 pt-2 border-t border-red-500/10 text-[10px] text-emerald-500 uppercase font-mono tracking-tighter">
                              环境音反馈: {shot.soundEffects}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-700 italic flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-gray-800"></span>
                          无声处理
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="bg-black/50 p-3 rounded-lg border border-white/5 text-xs text-gray-400 leading-relaxed select-all hover:border-amber-500/30 transition-all">
                        {renderRichText(shot.imagePrompt)}
                      </div>
                    </td>
                    <td className="p-4 relative group/v">
                      <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-900/20 text-xs text-blue-100/90 leading-relaxed hover:border-blue-500/40 transition-all shadow-lg min-h-[160px]">
                        <button 
                          onClick={() => handleCopy(shot.videoPrompt, shot.shotNo)}
                          className="absolute top-6 right-6 opacity-0 group-hover/v:opacity-100 bg-amber-500 text-black px-2 py-1 rounded text-[10px] font-bold uppercase transition-all hover:scale-105 active:scale-95 z-10"
                        >
                          {copiedShot === shot.shotNo ? '已复制' : '复制提示词'}
                        </button>
                        <div className="whitespace-pre-wrap font-light pr-8">
                          {renderVideoPrompt(shot.videoPrompt)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setActiveCommentShot(activeCommentShot === shot.shotNo ? null : shot.shotNo)}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-amber-500 hover:text-black transition-all"
                      >
                        <span className="text-lg">💬</span>
                        <span className="text-[10px] font-bold uppercase">{shot.comments?.length || 0} 评审</span>
                      </button>
                    </td>
                  </tr>
                  {activeCommentShot === shot.shotNo && (
                    <tr>
                      <td colSpan={7} className="bg-black/40 border-b border-[#222] p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="max-w-4xl mx-auto space-y-6">
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <h4 className="text-amber-500 font-bold uppercase tracking-widest text-xs">分镜工业评审组</h4>
                            <span className="text-[10px] text-gray-500 italic">当前视角：{currentUser.name} ({currentUser.role})</span>
                          </div>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                            {shot.comments && shot.comments.length > 0 ? (
                              shot.comments.map((c) => (
                                <div key={c.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-4">
                                  <div className="w-8 h-8 bg-amber-500/20 rounded flex items-center justify-center text-amber-500 font-bold text-xs">
                                    {c.userName.charAt(0)}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between">
                                      <span className="font-bold text-white text-xs">{c.userName} <span className="text-gray-500 font-normal ml-2">[{c.userRole}]</span></span>
                                      <span className="text-[10px] text-gray-600">{new Date(c.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">{c.text}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-8 text-gray-600 italic text-sm">暂无评审意见。您可以对 10s 三帧关联性、OS 视觉化精准度或空景隐喻提出建议。</p>
                            )}
                          </div>
                          <div className="flex gap-3 mt-4">
                            <input 
                              type="text" 
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(shot.shotNo)}
                              placeholder="输入导演/主美的专业修改建议..."
                              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none transition-all"
                            />
                            <button onClick={() => handleSubmitComment(shot.shotNo)} className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl text-xs uppercase hover:bg-white transition-all">提交反馈</button>
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
    </div>
  );
};

const renderVideoPrompt = (text: string) => {
  if (!text) return null;
  const timeTags = ['[0-3s]', '[3-7s]', '[7-10s]', '第一阶段', '第二阶段', '第三阶段'];
  const lines = text.split('\n');
  
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const hasTag = timeTags.some(tag => trimmed.includes(tag));
    // 识别台词
    const hasDialogue = trimmed.includes('“') && trimmed.includes('”');
    // 识别演化逻辑
    const hasEvolution = trimmed.includes('演化') || trimmed.includes('推移') || trimmed.includes('变化') || trimmed.includes('过渡');
    // 识别 OS/内心
    const isOSVisual = trimmed.includes('内心') || trimmed.includes('OS') || trimmed.includes('神态') || trimmed.includes('瞳孔') || trimmed.includes('挣扎');
    // 识别环境音视觉化
    const hasAmbient = trimmed.includes('音') || trimmed.includes('声') || trimmed.includes('颤动') || trimmed.includes('震动') || trimmed.includes('余韵');
    
    return (
      <div 
        key={i} 
        className={`
          mb-1.5
          ${hasTag ? 'mt-4 font-black text-amber-500 border-l-4 border-amber-500 pl-3 bg-amber-500/10 py-1' : ''}
          ${hasDialogue ? 'text-rose-300 font-bold italic bg-rose-900/10 px-1 border-b border-rose-900/30' : ''}
          ${hasEvolution && !hasTag ? 'text-green-400 font-medium' : ''}
          ${isOSVisual && !hasTag && !hasDialogue ? 'text-blue-300 font-light' : ''}
          ${hasAmbient && !hasTag && !hasDialogue && !isOSVisual && !hasEvolution ? 'text-emerald-400/80 font-mono text-[11px]' : ''}
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
        <span className={`${isOS ? 'text-blue-400' : 'text-red-400'} font-bold not-italic`}>{match[1]}</span>
        <span className="text-amber-500/80 text-[11px] not-italic ml-1">{match[2]}</span>
        <span className="block mt-1 text-gray-200 not-italic border-l-2 border-red-900/50 pl-2">
          {isOS ? <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded mr-1">OS</span> : null}
          “{match[3]}”
        </span>
      </span>
    );
  }
  return (
    <span>
      {isOS && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded mr-1">内心 OS</span>}
      “{text}”
    </span>
  );
};

const renderRichText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|【.*?】)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="text-amber-500 font-bold">{part.replace(/\*\*/g, '')}</span>;
    }
    if (part.startsWith('【') && part.endsWith('】')) {
      return <span key={i} className="px-1.5 py-0.5 mx-0.5 bg-amber-500 text-black font-black text-[10px] rounded shadow-sm border border-amber-400">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default ShotCard;
