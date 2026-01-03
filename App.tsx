
import React, { useState, useEffect, useRef } from 'react';
import { generateStoryboard, testApiConnection } from './services/geminiService';
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
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  
  // API Configuration State
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState(localStorage.getItem('导演_API_URL') || '');
  const [customKey, setCustomKey] = useState(localStorage.getItem('导演_API_KEY') || '');
  const [modelFlash, setModelFlash] = useState(localStorage.getItem('导演_MODEL_FLASH') || 'gemini-3-flash-preview');
  const [modelPro, setModelPro] = useState(localStorage.getItem('导演_MODEL_PRO') || 'gemini-3-pro-preview');
  const [isLowQuotaMode, setIsLowQuotaMode] = useState(localStorage.getItem('导演_LOW_QUOTA_MODE') === 'true');
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testErrorMessage, setTestErrorMessage] = useState('');

  const [currentUser, setCurrentUser] = useState(COLLABORATORS[0]);
  const [isCollaborating, setIsCollaborating] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowApiSettings(false);
      }
    };
    if (showApiSettings) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showApiSettings]);

  useEffect(() => {
    setHasApiKey(!!customKey.trim());
  }, [customKey]);

  const saveApiSettings = () => {
    localStorage.setItem('导演_API_URL', customEndpoint.trim().replace(/\/+$/, ''));
    localStorage.setItem('导演_API_KEY', customKey.trim());
    localStorage.setItem('导演_MODEL_FLASH', modelFlash.trim());
    localStorage.setItem('导演_MODEL_PRO', modelPro.trim());
    localStorage.setItem('导演_LOW_QUOTA_MODE', String(isLowQuotaMode));
    if (customKey.trim()) setHasApiKey(true);
  };

  const handleTestConnection = async () => {
    if (!customKey.trim()) {
      setTestStatus('error');
      setTestErrorMessage('请输入 API Key');
      return;
    }
    saveApiSettings();
    setTestStatus('testing');
    setTestErrorMessage('');
    const result = await testApiConnection();
    if (result.success) setTestStatus('success');
    else {
      setTestStatus('error');
      setTestErrorMessage(result.message);
    }
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!plot.trim()) return setError("请先输入剧本正文。");
    if (!hasApiKey && !customKey) return setError("请先配置 API Key。");

    setLoading(true);
    setLoadingMsg("正在初始化导演引擎...");
    setError(null);
    try {
      const storyboard = await generateStoryboard(plot, (msg) => setLoadingMsg(msg));
      setResult(storyboard);
      setIsCollaborating(true);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "生成失败";
      if (msg.includes("429") || msg.includes("quota")) {
        msg = "❌ 额度已耗尽 (429)：检测到您的 API 账户余额不足。建议：1. 检查中转站余额；2. 在右上角设置中开启[低额度极速模式]；3. 稍后再试。";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    let content = `| 镜号 | 时长 | 镜头文案| 语音分镜 | 图片提示词 | 视频提示词 | 音效|\n`;
    content += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    result.groups.forEach(group => {
      group.shots.forEach(shot => {
        content += `| ${shot.shotNo} | ${shot.duration} | ${shot.action} | ${shot.audio} | ${shot.imagePrompt} | ${shot.videoPrompt} | ${shot.soundEffects} |\n`;
      });
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `导演分镜表_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
      shots: group.shots.map(shot => shot.shotNo === shotNo ? { ...shot, comments: [...(shot.comments || []), newComment] } : shot)
    }));
    setResult({ ...result, groups: updatedGroups });
  };

  return (
    <div className="min-h-screen pb-24 selection:bg-amber-500/30 bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1a1a1a] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-xl serif-font shadow-[0_0_15px_rgba(245,158,11,0.3)]">D</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">电影分镜协作中心</h1>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase italic">Cinematic Director System</p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setShowApiSettings(!showApiSettings)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[11px] font-mono uppercase ${showApiSettings ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'}`}
          >
            <span className="text-sm">⚙️</span>
            {isLowQuotaMode ? '极速模式' : '标准模式'}
          </button>

          {showApiSettings && (
            <div ref={modalRef} className="absolute top-12 right-0 w-80 bg-[#111] border border-[#222] rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">高级配置</h3>
                <button onClick={() => setShowApiSettings(false)} className="text-gray-500">✕</button>
              </div>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">API 端点</label>
                  <input type="text" value={customEndpoint} onChange={(e) => setCustomEndpoint(e.target.value)} placeholder="https://proxy.com" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">API KEY</label>
                  <input type="password" value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="sk-..." className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none font-mono" />
                </div>

                <div className="pt-2 border-t border-white/5 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-amber-500 uppercase font-bold">基础模型 (Flash)</label>
                    <input type="text" value={modelFlash} onChange={(e) => setModelFlash(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-amber-500 uppercase font-bold">专业模型 (Pro)</label>
                    <input type="text" value={modelPro} onChange={(e) => setModelPro(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none" />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white font-bold uppercase">低额度极速模式</span>
                    <span className="text-[8px] text-gray-500">推荐配额紧张时开启（全部使用 Flash 模型）</span>
                  </div>
                  <button onClick={() => setIsLowQuotaMode(!isLowQuotaMode)} className={`w-10 h-5 rounded-full relative transition-all ${isLowQuotaMode ? 'bg-amber-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isLowQuotaMode ? 'left-5' : 'left-0.5'}`}></div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={handleTestConnection} disabled={testStatus === 'testing'} className="py-2 bg-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white/20">
                    {testStatus === 'testing' ? '中...' : '测试连接'}
                  </button>
                  <button onClick={() => { saveApiSettings(); setShowApiSettings(false); }} className="py-2 bg-amber-500 text-black rounded-lg text-[10px] font-bold uppercase hover:bg-white">保存应用</button>
                </div>
                
                {testErrorMessage && <p className="text-[9px] text-red-400 break-words">错误: {testErrorMessage}</p>}
                {testStatus === 'success' && <p className="text-[9px] text-green-400 uppercase font-bold">连接成功 ✓</p>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-amber-500 uppercase font-mono">{currentUser.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-lg shadow-lg">{currentUser.avatar}</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 mt-12">
        {!result && (
          <div className="flex flex-col items-center justify-center text-center space-y-12 py-20">
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-bold text-white serif-font tracking-tight">视界 <br /><span className="text-amber-500 italic">导演工业系统</span></h2>
              <p className="max-w-2xl text-gray-500 text-lg mx-auto font-light">
                针对 Gemini 3 工业化适配。如遇 429 报错，请开启极速模式。
              </p>
            </div>
            
            <div className="w-full max-w-4xl bg-[#111] p-1 rounded-[2.5rem] border border-[#222] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="bg-[#0a0a0a] rounded-[2.2rem] p-8 space-y-6">
                {!hasApiKey && !customKey ? (
                  <div className="py-12 px-6 border-2 border-dashed border-amber-500/30 rounded-3xl bg-amber-500/5 flex flex-col items-center">
                    <div className="text-4xl mb-4">🔑</div>
                    <h3 className="text-xl font-bold text-white mb-2">配置 API 密钥</h3>
                    <div className="flex gap-4 mt-6">
                      <button onClick={handleOpenKeyDialog} className="px-8 py-3 bg-amber-500 text-black font-bold rounded-full hover:bg-white shadow-lg">官方 Key</button>
                      <button onClick={() => setShowApiSettings(true)} className="px-8 py-3 bg-white/5 border border-white/20 font-bold rounded-full hover:bg-white/10">第三方配置</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea value={plot} onChange={(e) => setPlot(e.target.value)} placeholder="在此输入剧本内容..." className="w-full h-64 bg-transparent border-none text-white text-lg focus:ring-0 resize-none font-light leading-relaxed placeholder:text-gray-700" />
                    <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-6">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] text-gray-600 font-mono flex items-center gap-2 uppercase tracking-widest">
                          <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span> {hasApiKey ? '引擎就绪' : '等待 Key'}
                        </span>
                        {isLowQuotaMode && <span className="text-[9px] text-amber-500/80 font-bold">⚠️ 当前处于低配额极速模式</span>}
                      </div>
                      <button onClick={handleGenerate} disabled={loading} className="px-12 py-4 bg-amber-500 text-black font-bold rounded-full hover:bg-white transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                        {loading ? '构思中...' : '开始构思分镜'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              {error && (
                <div className="mt-4 px-8 pb-4">
                  <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl text-xs text-left leading-relaxed">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-16 animate-in fade-in duration-700">
             <div className="flex justify-between items-end border-b border-[#222] pb-12">
              <div className="space-y-4">
                <button onClick={() => { setResult(null); }} className="px-6 py-2.5 bg-amber-500 text-black rounded-full text-xs font-bold">← 返回编辑剧本</button>
                <div className="space-y-2 pt-4">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-[0.3em]">全量分镜蓝图</span>
                  <h3 className="text-5xl font-bold text-white serif-font tracking-tight">视觉核心导演方案</h3>
                </div>
              </div>
              <button onClick={handleExport} className="px-10 py-3 bg-white text-black rounded-full text-xs font-black shadow-xl">📥 导出 (TXT)</button>
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
            <div className="w-32 h-32 mb-10 relative">
              <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-amber-500 font-bold uppercase tracking-[0.6em] mb-4 text-xl">正在分阶段进行分镜会审</h3>
            <p className="text-gray-400 text-sm max-w-md italic">{loadingMsg}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
