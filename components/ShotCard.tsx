
import React from 'react';
import { ShotGroup } from '../types';

interface ShotCardProps { group: ShotGroup; }

const ShotCard: React.FC<ShotCardProps> = ({ group }) => {
  return (
    <div className="mb-16 bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
      {/* Event Header */}
      <div className="bg-[#1a1a1a] p-6 border-b border-[#333]">
        <div className="flex items-center gap-4 mb-3">
          <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded">分镜组</span>
          <h2 className="text-xl font-bold text-white serif-font">{group.eventTitle}</h2>
        </div>
        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-amber-500 font-bold uppercase mb-2">导演推理分析 / DIRECTOR'S REASONING</div>
          <p className="text-sm text-gray-300 leading-relaxed italic whitespace-pre-wrap">{group.reasoning}</p>
        </div>
      </div>

      {/* Professional Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="bg-[#161616] text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-4 border-b border-[#222] w-20 text-center">镜号</th>
              <th className="p-4 border-b border-[#222] w-24 text-center">时长</th>
              <th className="p-4 border-b border-[#222] w-1/4">镜头文案 (场景/前中后景/动作)</th>
              <th className="p-4 border-b border-[#222] w-48">语音分镜 (台词与语气)</th>
              <th className="p-4 border-b border-[#222] w-1/5">绘画提示词 (中文)</th>
              <th className="p-4 border-b border-[#222] w-1/5">视频提示词 (中文)</th>
              <th className="p-4 border-b border-[#222] w-32">音效/氛围</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {group.shots.map((shot, idx) => (
              <tr key={idx} className="align-top hover:bg-white/[0.02] transition-colors border-b border-[#1a1a1a]">
                <td className="p-4 font-mono text-amber-500 font-bold text-center border-r border-[#1a1a1a]">{shot.shotNo}</td>
                <td className="p-4 font-mono text-gray-300 text-center border-r border-[#1a1a1a]">{shot.duration}</td>
                <td className="p-4">
                  <div className="space-y-2">
                    <p className="text-gray-200 leading-relaxed">{renderRichText(shot.action)}</p>
                    <div className="flex gap-2">
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
                  <div className="bg-blue-900/5 p-3 rounded-lg border border-blue-900/20 text-xs text-blue-200/60 leading-relaxed select-all hover:border-blue-500/40 transition-all">
                    {shot.videoPrompt}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="mt-1">🔊</span>
                    <span>{shot.soundEffects}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const renderDialogue = (text: string) => {
  // 匹配：角色名（语气）：内容
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
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => 
    part.startsWith('**') && part.endsWith('**') 
      ? <span key={i} className="text-amber-500 font-bold">{part.replace(/\*\*/g, '')}</span>
      : <span key={i}>{part}</span>
  );
};

export default ShotCard;
