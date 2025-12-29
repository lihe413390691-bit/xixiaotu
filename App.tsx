
import React, { useState, useEffect } from 'react';
import { generateStoryboard } from './services/geminiService';
import { StoryboardResponse, Collaborator, Comment } from './types';
import ShotCard from './components/ShotCard';

const COLLABORATORS: Collaborator[] = [
  { id: '1', name: '江导演', role: '总导演', avatar: '📽️', isOnline: true },
  { id: '2', name: '王主美', role: '美术总监', avatar: '🎨', isOnline: true },
  { id: '3', name: '李监制', role: '制片人', avatar: '🎬', isOnline: true },
  { id: '4', name: '张剪辑', role: '剪辑师', avatar: '✂️', isOnline: false },
];

const App: React.FC = () => {
  const [plot, setPlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState<StoryboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState(COLLABORATORS[0]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Collaborator[]>(COLLABORATORS.filter(c => c.isOnline));

  const handleGenerate = async () => {
    if (!plot.trim()) {
      setError("请先输入剧情内容。");
      return;
    }

    setLoading(true);
    setLoadingMsg("正在初始化导演引擎...");
    setError(null);
    try {
      const storyboard = await generateStoryboard(plot, (msg) => setLoadingMsg(msg));
      setResult(storyboard);
      setIsCollaborating(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成失败，请检查网络或尝试简化剧情。");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = (shotNo: string, text: string) => {
    if (!result) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userName: currentUser.name,
      userRole: currentUser.role,
      text,
      timestamp: Date.now()
    };
    const updatedGroups = result.groups.map(group => ({
      ...group,
      shots: group.shots.map(shot => {
        if (shot.shotNo === shotNo) {
          return { ...shot, comments: [...(shot.comments || []), newComment] };
        }
        return shot;
      })
    }));
    setResult({ ...result, groups: updatedGroups });
  };

  useEffect(() => {
    if (!isCollaborating || !result) return;
    const interval = setInterval(() => {
      setActiveUsers(prev => COLLABORATORS.map(c => ({
        ...c,
        isOnline: Math.random() > 0.3
      })).filter(c => c.isOnline));
    }, 10000);
    return () => clearInterval(interval);
  }, [isCollaborating, result]);

  return (
    <div className="min-h-screen pb-24 selection:bg-amber-500/30">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1a1a1a] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-xl serif-font shadow-[0_0_15px_rgba(245,158,11,0.3)]">D</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white uppercase">电影分镜协作中心</h1>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase italic">Cinematic Collaboration Hub</p>
          </div>
        </div>

        {isCollaborating && (
          <div className="hidden md:flex items-center gap-6 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex -space-x-3">
              {activeUsers.map(u => (
                <div key={u.id} className="w-8 h-8 rounded-full bg-[#222] border-2 border-[#0a0a0a] flex items-center justify-center text-sm relative">
                  {u.avatar}
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-[#0a0a0a] rounded-full"></span>
                </div>
              ))}
            </div>
            <div className="h-6 w-px bg-white/10"></div>
            <select 
              value={currentUser.id}
              onChange={(e) => setCurrentUser(COLLABORATORS.find(c => c.id === e.target.value) || COLLABORATORS[0])}
              className="bg-transparent text-amber-500 text-[11px] font-bold border-none focus:ring-0 cursor-pointer"
            >
              {COLLABORATORS.map(c => <option key={c.id} value={c.id} className="bg-[#111]">{c.role}: {c.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{currentUser.name}</p>
            <p className="text-[10px] text-amber-500 uppercase font-mono">{currentUser.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-lg">{currentUser.avatar}</div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 mt-12">
        {!result && (
          <div className="flex flex-col items-center justify-center text-center space-y-12 py-20">
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-bold text-white serif-font tracking-tight leading-tight">视界 <br /><span className="text-amber-500 italic">工业级实时协作</span></h2>
              <p className="max-w-2xl text-gray-500 text-lg mx-auto font-light">基于 Gemini 3 Pro 顶级导演思维模型。支持超长剧本自动拆解、分镜全中文深度生成。</p>
            </div>
            
            <div className="w-full max-w-4xl bg-[#111] p-1 rounded-[2.5rem] border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="bg-[#0a0a0a] rounded-[2.2rem] p-8 space-y-6">
                <textarea
                  value={plot}
                  onChange={(e) => setPlot(e.target.value)}
                  placeholder="在此输入或粘贴剧本剧情，系统将自动进行长文本结构化处理..."
                  className="w-full h-64 bg-transparent border-none text-white text-lg focus:ring-0 resize-none font-light leading-relaxed"
                />
                <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-6">
                  <span className="text-[10px] text-gray-600 font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> 长剧本全量支持模式
                  </span>
                  <button onClick={handleGenerate} disabled={loading} className="px-12 py-4 bg-amber-500 rounded-full font-bold text-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50">
                    {loading ? '正在构思中...' : '开始构思分镜'}
                  </button>
                </div>
              </div>
              {error && <div className="mt-4 px-8 pb-4 text-red-500 text-xs text-center font-bold uppercase">错误: {error}</div>}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-16">
            <div className="flex justify-between items-end border-b border-[#222] pb-12">
              <div className="space-y-2">
                <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">全量分镜蓝图 / FULL STORYBOARD</span>
                <h3 className="text-5xl font-bold text-white serif-font tracking-tight">视觉核心蓝图</h3>
                <p className="text-gray-400 italic mt-4">已完成 {result.groups.length} 个事件段落，共计 {result.totalShots} 个分镜。</p>
              </div>
              <button onClick={() => { setResult(null); setIsCollaborating(false); }} className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-400 hover:text-white">重新导入剧本</button>
            </div>
            <div className="space-y-12">
              {result.groups.map((group, idx) => (
                <ShotCard key={idx} group={group} currentUser={currentUser} onAddComment={handleAddComment} />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 mb-10 relative">
              <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-amber-500 font-bold uppercase tracking-[0.6em] mb-4 text-xl">导演组正在分阶段会审</h3>
            <p className="text-gray-400 text-sm max-w-md italic leading-relaxed">{loadingMsg}</p>
          </div>
        )}
      </main>
      <footer className="mt-40 border-t border-[#1a1a1a] py-20 text-center text-gray-800 text-[9px] uppercase tracking-[1em] font-black">
        工业级实时分镜协作系统 &copy; 2025
      </footer>
    </div>
  );
};

export default App;
