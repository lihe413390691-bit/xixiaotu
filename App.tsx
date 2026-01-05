
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
  const [customModel, setCustomModel] = useState(localStorage.getItem('导演_API_MODEL') || '');
  const [isCompatibleMode, setIsCompatibleMode] = useState(localStorage.getItem('导演_API_COMPATIBLE') === 'true');
  const [isLowQuotaMode, setIsLowQuotaMode] = useState(localStorage.getItem('导演_LOW_QUOTA_MODE') === 'true');
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

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
    localStorage.setItem('导演_API_MODEL', customModel.trim());
    localStorage.setItem('导演_API_COMPATIBLE', String(isCompatibleMode));
    localStorage.setItem('导演_LOW_QUOTA_MODE', String(isLowQuotaMode));
    if (customKey.trim()) setHasApiKey(true);
  };

  const handleTestConnection = async () => {
    if (!customKey.trim()) {
      setTestStatus('error');
      setTestMessage('请输入 API Key');
      return;
    }
    setTestStatus('testing');
    setTestMessage('');
    const result = await testApiConnection(customKey, customEndpoint, isCompatibleMode, customModel);
    if (result.success) {
      setTestStatus('success');
      setTestMessage(result.message);
      saveApiSettings(); // 测试成功自动保存
    } else {
      setTestStatus('error');
      setTestMessage(result.message);
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
    <div className="min-h-screen pb-24 selection:bg-amber-500/30 bg-[#0a0a0a] text-white overflow-x-hidden">
      <header className="sticky top-0 z-[60] bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1a1a1a] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-xl serif-font shadow-[0_0_15px_rgba(245,158,11,0.3)]">D</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">电影分镜协作中心</h1>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase italic">Cinematic Director System</p>
          </div>
        </div>

        <div className="flex items-center gap-6 relative">
          <button 
            onClick={() => setShowApiSettings(true)}
            className="group flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 transition-all text-[11px] font-bold uppercase hover:bg-white hover:text-black hover:border-white shadow-lg"
          >
            <span className="text-sm transition-transform group-hover:rotate-45">⚙️</span>
            API配置
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
              <p className="text-[9px] text-amber-500 uppercase font-mono tracking-tighter">{currentUser.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-lg shadow-lg border border-white/10">{currentUser.avatar}</div>
          </div>
        </div>
      </header>

      {/* API 配置模态框 - 高端设计 */}
      {showApiSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            ref={modalRef} 
            className="w-full max-w-md bg-[#111] border border-[#222] rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.1)] animate-in zoom-in-95 duration-300"
          >
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white serif-font tracking-tight">API 服务底座配置</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Advanced Engine Settings</p>
                </div>
                <button onClick={() => setShowApiSettings(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">第三方 API 链接 (Base URL)</label>
                  <input 
                    type="text" 
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all placeholder:text-gray-800 font-mono shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">API 访问密钥 (Key)</label>
                  <input 
                    type="password" 
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all font-mono shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">推理模型名称 (Model Name)</label>
                  <input 
                    type="text" 
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="gemini-2.5-pro-latest"
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all font-mono shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-300 block">兼容第三方API</span>
                    <span className="text-[9px] text-gray-500 uppercase">启用非原生中转代理支持</span>
                  </div>
                  <button 
                    onClick={() => setIsCompatibleMode(!isCompatibleMode)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isCompatibleMode ? 'bg-amber-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${isCompatibleMode ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-300 block">低额度极速模式</span>
                    <span className="text-[9px] text-gray-500 uppercase">全部强制调用 Flash 模型</span>
                  </div>
                  <button 
                    onClick={() => setIsLowQuotaMode(!isLowQuotaMode)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isLowQuotaMode ? 'bg-amber-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${isLowQuotaMode ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {testStatus !== 'idle' && (
                  <div className={`p-4 rounded-2xl border text-[10px] font-mono leading-relaxed transition-all animate-in slide-in-from-top-2 ${
                    testStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                    testStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testStatus === 'testing' ? (
                        <div className="w-2 h-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
                      ) : testStatus === 'success' ? (
                        <span className="text-emerald-500">✓</span>
                      ) : (
                        <span className="text-red-500">✕</span>
                      )}
                      {testMessage}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all text-gray-300 disabled:opacity-50"
                >
                  链接测试
                </button>
                <button 
                  onClick={() => { saveApiSettings(); setShowApiSettings(false); }}
                  className="flex-1 py-4 bg-amber-500 text-black rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1500px] mx-auto px-6 mt-12">
        {!result && (
          <div className="flex flex-col items-center justify-center text-center space-y-12 py-20 animate-in fade-in duration-700">
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-bold text-white serif-font tracking-tight">视界 <br /><span className="text-amber-500 italic">导演工业系统</span></h2>
              <p className="max-w-2xl text-gray-500 text-lg mx-auto font-light leading-relaxed">
                顶尖分镜推理引擎。地毯式解析剧本核心指令，锁定 <span className="text-amber-500 font-medium">△ 指标</span>，同步嵌入对白与系统音。
              </p>
            </div>
            
            <div className="w-full max-w-4xl bg-[#111] p-1 rounded-[3.5rem] border border-[#222] shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
              <div className="bg-[#0a0a0a] rounded-[3.2rem] p-10 space-y-8">
                {!hasApiKey && !customKey ? (
                  <div className="py-16 px-6 border-2 border-dashed border-amber-500/20 rounded-[2.5rem] bg-amber-500/[0.02] flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-3xl mb-6 shadow-inner">🔑</div>
                    <h3 className="text-2xl font-bold text-white mb-2 serif-font">初始化导演引擎</h3>
                    <p className="text-gray-500 text-sm mb-10 max-w-xs">为了启动工业级推理逻辑，我们需要配置您的 API 连接底座。</p>
                    <div className="flex gap-4">
                      <button onClick={handleOpenKeyDialog} className="px-10 py-4 bg-amber-500 text-black font-black text-xs uppercase rounded-full hover:bg-white shadow-xl shadow-amber-500/10 transition-all">官方认证</button>
                      <button onClick={() => setShowApiSettings(true)} className="px-10 py-4 bg-white/5 border border-white/10 font-black text-xs uppercase rounded-full hover:bg-white/10 transition-all">自定义配置</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea 
                      value={plot} 
                      onChange={(e) => setPlot(e.target.value)} 
                      placeholder="在此处输入或粘贴剧本正文内容..." 
                      className="w-full h-80 bg-transparent border-none text-white text-xl focus:ring-0 resize-none font-light leading-relaxed placeholder:text-gray-800" 
                    />
                    <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-8">
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">引擎连接正常</span>
                        </div>
                        {isLowQuotaMode && <span className="text-[9px] text-amber-500/60 font-black uppercase tracking-tighter">⚡ 当前处于低配额极速模式</span>}
                      </div>
                      <button 
                        onClick={handleGenerate} 
                        disabled={loading} 
                        className="px-16 py-5 bg-amber-500 text-black font-black text-sm uppercase rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                      >
                        {loading ? '构思中...' : '启动分镜推理'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              {error && (
                <div className="mt-4 px-10 pb-6">
                  <div className="bg-red-600/10 border border-red-600/30 text-red-500 px-8 py-5 rounded-[2rem] text-xs text-left leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                    <span className="font-bold mr-2">SYSTEM ERROR:</span> {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <div className="flex justify-between items-end border-b border-[#222] pb-12">
              <div className="space-y-6">
                <button 
                  onClick={() => { setResult(null); }} 
                  className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all"
                >
                  ← 返回剧本编辑
                </button>
                <div className="space-y-2">
                  <span className="text-amber-500 text-xs font-black uppercase tracking-[0.4em] block italic">Industrial Storyboard Blueprint</span>
                  <h3 className="text-6xl font-bold text-white serif-font tracking-tight">视觉核心导演方案</h3>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={handleExport} className="px-12 py-4 bg-amber-500 text-black rounded-full text-[11px] font-black uppercase shadow-2xl hover:bg-white transition-all">📥 导出完整分镜表</button>
              </div>
            </div>
            <div className="space-y-16">
              {result.groups.map((group, idx) => (
                <ShotCard key={idx} group={group} currentUser={currentUser} onAddComment={handleAddComment} />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-3xl">
            <div className="w-48 h-48 mb-12 relative">
              <div className="absolute inset-0 border-[6px] border-amber-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-[6px] border-t-amber-500 rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-[2px] border-amber-500/5 rounded-full animate-reverse-spin"></div>
            </div>
            <div className="space-y-4 max-w-lg">
              <h3 className="text-white font-bold uppercase tracking-[1em] text-2xl serif-font italic">正在同步工业分镜蓝图</h3>
              <p className="text-amber-500/60 text-xs font-mono uppercase tracking-[0.3em] animate-pulse">{loadingMsg}</p>
            </div>
            <div className="mt-16 w-64 h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 animate-loading-bar"></div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin 3s linear infinite;
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
