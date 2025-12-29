
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

  const handleSubmitComment = (shotNo: string) => {
    if (!commentText.trim()) return;
    onAddComment(shotNo, commentText);
    setCommentText('');
    setActiveCommentShot(null);
  };

  return (
    <div className="mb-16 bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
      {/* Event Header */}
      <div className="bg-[#1a1a1a] p-6 border-b border-[#333]">
        <div className="flex items-center gap-4 mb-3">
          <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded">分镜组</span>
          <h2 className="text-xl font-bold text-white serif-font">{group.eventTitle}</h2>
        </div>
        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-amber-500 font-bold uppercase mb-2">导演构思分析 / DIRECTOR'S REASONING</div>
          <p className="text-sm text-gray-300 leading-relaxed italic whitespace-pre-wrap">{group.reasoning}</p>
        </div>
      </div>

      {/* Professional Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead className="bg-[#161616] text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-4 border-b border-[#222] w-20 text-center">镜号</th>
              <th className="p-4 border-b border-[#222] w-24 text-center">预计时长</th>
              <th className="p-4 border-b border-[#222] w-1/4">镜头文案 (动作/场景)</th>
              <th className="p-4 border-b border-[#222] w-48">语音分镜 (台词表演)</th>
              <th className="p-4 border-b border-[#222] w-1/5">绘画提示词 (极美剧照)</th>
              <th className="p-4 border-b border-[#222] w-1/3">视频提示词 (动态连贯)</th>
              <th className="p-4 border-b border-[#222] w-40 text-center">协作反馈</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {group.shots.map((shot, idx) => (
              <React.Fragment key={idx}>
                <tr className="align-top hover:bg-white/[0.02] transition-colors border-b border-[#1a1a1a]">
                  <td className="p-4 font-mono text-amber-500 font-bold text-center border-r border-[#1a1a1a]">{shot.shotNo}</td>
                  <td className="p-4 font-mono text-gray-300 text-center border-r border-[#1a1a1a]">{shot.duration}</td>
                  <td className="p-4">
                    <div className="space-y-2">
                      <p className="text-gray-200 leading-relaxed">{renderRichText(shot.action)}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-900/20 text-blue-400 rounded border border-blue-900/30 uppercase">{shot.lighting}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/20 text-purple-400 rounded border border-purple-900/30 uppercase">{shot.tone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 border-r border-[#1a1a1a]">
                    {shot.audio ? (
                      <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                        <p className="text-red-200/80 italic leading-relaxed whitespace-pre-wrap font-serif">
                          {renderDialogue(shot.audio)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-700 italic">-- 无对白 --</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="bg-black/50 p-3 rounded-lg border border-white/5 text-xs text-gray-400 leading-relaxed select-all hover:border-amber-500/30 transition-all">
                      {shot.imagePrompt}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-900/20 text-xs text-blue-100/90 leading-relaxed hover:border-blue-500/40 transition-all shadow-lg">
                      <div className="whitespace-pre-wrap font-light">
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
                      <span className="text-[10px] font-bold uppercase">{shot.comments?.length || 0} 反馈</span>
                    </button>
                  </td>
                </tr>
                {activeCommentShot === shot.shotNo && (
                  <tr>
                    <td colSpan={7} className="bg-black/40 border-b border-[#222] p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <h4 className="text-amber-500 font-bold uppercase tracking-widest text-xs">分镜评审会</h4>
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
                            <p className="text-center py-8 text-gray-600 italic text-sm">暂无反馈，团队成员可在此提出修改意见。</p>
                          )}
                        </div>
                        <div className="flex gap-3 mt-4">
                          <input 
                            type="text" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(shot.shotNo)}
                            placeholder="输入您的专业评审意见..."
                            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-amber-500/50 outline-none transition-all"
                          />
                          <button onClick={() => handleSubmitComment(shot.shotNo)} className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl text-xs uppercase hover:bg-white transition-all">提交反馈</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const renderVideoPrompt = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    // 匹配衔接逻辑
    const isContinuity = trimmed.includes('衔接') || trimmed.includes('承接');
    // 匹配数字列表
    const isNumbered = /^\d+\./.test(trimmed);
    
    return (
      <div 
        key={i} 
        className={`
          ${isNumbered ? 'mt-3 border-l-2 border-amber-500/50 pl-3 py-1 bg-white/5 rounded-r-lg' : ''}
          ${isContinuity ? 'text-amber-400 font-medium italic' : ''}
        `}
      >
        {line}
      </div>
    );
  });
};

const renderDialogue = (text: string) => {
  if (!text) return null;
  const dialogueRegex = /^([^(（]+)([（(][^）)]+[）)])[:：\s]*(.*)$/;
  const match = text.match(dialogueRegex);
  if (match) {
    return (
      <span className="block">
        <span className="text-red-400 font-bold not-italic">{match[1]}</span>
        <span className="text-amber-500/80 text-[11px] not-italic ml-1">{match[2]}</span>
        <span className="block mt-1 text-gray-200 not-italic border-l-2 border-red-900/50 pl-2">“{match[3]}”</span>
      </span>
    );
  }
  return `“${text}”`;
};

const renderRichText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => 
    part.startsWith('**') && part.endsWith('**') 
      ? <span key={i} className="text-amber-500 font-bold">{part.replace(/\*\*/g, '')}</span>
      : <span key={i}>{part}</span>
  );
};

export default ShotCard;
