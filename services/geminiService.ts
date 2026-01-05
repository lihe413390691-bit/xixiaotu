
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardResponse, ShotGroup } from "../types";

const extractJson = (text: string): string => {
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match = codeBlockRegex.exec(text);
  if (match && match[1]) return match[1].trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }
  return text.trim();
};

const getModelConfig = () => {
  const customModel = localStorage.getItem('导演_API_MODEL');
  if (customModel && customModel.trim() !== '') {
    return {
      flash: customModel,
      pro: customModel,
      isLowQuotaMode: false
    };
  }
  return {
    flash: localStorage.getItem('导演_MODEL_FLASH') || 'gemini-3-flash-preview',
    pro: localStorage.getItem('导演_MODEL_PRO') || 'gemini-3-pro-preview',
    isLowQuotaMode: localStorage.getItem('导演_LOW_QUOTA_MODE') === 'true'
  };
};

const getApiClient = () => {
  const customKey = localStorage.getItem('导演_API_KEY');
  const isCompatible = localStorage.getItem('导演_API_COMPATIBLE') === 'true';
  let customEndpoint = localStorage.getItem('导演_API_URL');
  const apiKey = customKey?.trim() || process.env.API_KEY || '';
  
  let baseUrl: string | undefined = undefined;
  if (isCompatible && customEndpoint && customEndpoint.trim() !== '') {
    baseUrl = customEndpoint.trim()
      .replace(/\/v1beta\/?$/, '')
      .replace(/\/v1\/?$/, '')
      .replace(/\/+$/, '');
  }

  return new GoogleGenAI({ 
    apiKey,
    baseUrl: baseUrl || undefined 
  });
};

export const testApiConnection = async (tempKey?: string, tempUrl?: string, compatible?: boolean, tempModel?: string): Promise<{ success: boolean; message: string }> => {
  const apiKey = tempKey || localStorage.getItem('导演_API_KEY') || process.env.API_KEY || '';
  if (!apiKey) {
    return { success: false, message: "尚未配置 API Key" };
  }
  try {
    const isCompatible = compatible ?? (localStorage.getItem('导演_API_COMPATIBLE') === 'true');
    const customEndpoint = tempUrl || localStorage.getItem('导演_API_URL');
    let baseUrl: string | undefined = undefined;
    if (isCompatible && customEndpoint && customEndpoint.trim() !== '') {
      baseUrl = customEndpoint.trim().replace(/\/v1beta\/?$/, '').replace(/\/v1\/?$/, '').replace(/\/+$/, '');
    }

    const ai = new GoogleGenAI({ apiKey, baseUrl });
    const modelToUse = tempModel || getModelConfig().flash;
    
    await ai.models.generateContent({
      model: modelToUse,
      contents: "ping",
      config: { maxOutputTokens: 1 }
    });
    return { success: true, message: `连接成功！已检测到模型：${modelToUse}` };
  } catch (error: any) {
    let msg = error.message || "连接失败";
    if (msg.includes("429")) msg = "额度已耗尽 (429): 请检查余额或开启极速模式";
    return { success: false, message: msg };
  }
};

export const segmentPlot = async (plot: string): Promise<string[]> => {
  const ai = getApiClient();
  const { flash } = getModelConfig();
  
  const response = await ai.models.generateContent({
    model: flash,
    contents: `你是一名世界顶级的剧作监制。请地毯式研读剧本，将其拆解为若干核心事件段落。

【绝对禁令】
1. **识别“△”标志**：剧本中所有以“△”开头的描述都是核心镜头指令，必须完整保留。
2. **零遗漏对白**：必须完整保留每一句台词、OS 内心独白和环境声描述。
3. 全部使用中文输出，严禁出现任何英文单词或缩写。

剧本内容:
<<< ${plot} >>>`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  try {
    return JSON.parse(extractJson(response.text));
  } catch (e) {
    return [plot];
  }
};

export const generateShotGroup = async (segment: string, isFirst: boolean): Promise<ShotGroup> => {
  const ai = getApiClient();
  const isCompatible = localStorage.getItem('导演_API_COMPATIBLE') === 'true';
  const { pro, flash, isLowQuotaMode } = getModelConfig();
  const activeModel = isLowQuotaMode ? flash : pro;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      required: ["eventTitle", "reasoning", "sceneName", "scenePrompt", "shots"],
      properties: {
        eventTitle: { type: Type.STRING },
        reasoning: { type: Type.STRING, description: "导演对剧作全量的深度推理，解析视觉爆发点。必须全中文。" },
        sceneName: { type: Type.STRING, description: "本段落使用的核心场景名称。" },
        scenePrompt: { type: Type.STRING, description: "纯场景环境底图提示词，详细描述光影、材质、空间感，严禁出现人物。必须全中文。" },
        shots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["shotNo", "duration", "action", "audio", "imagePrompt", "videoPrompt", "soundEffects", "lighting", "tone"],
            properties: {
              shotNo: { type: Type.STRING },
              duration: { type: Type.STRING, description: "固定为10秒" },
              action: { type: Type.STRING, description: "镜头细节。若有震撼、宏伟、激昂、澎湃等词，请使用 [[词汇]] 格式标注。" },
              audio: { type: Type.STRING, description: "还原对白/独白。必须全中文。" },
              imagePrompt: { type: Type.STRING, description: "绘画提示词。要求：使用中文，识别场景和人物并用【 】标注。" },
              videoPrompt: { type: Type.STRING, description: "Sora 工业级 10秒 提示词。必须包含衔接逻辑、嵌入对白、系统音结构块及物理反馈。" },
              soundEffects: { type: Type.STRING },
              lighting: { type: Type.STRING },
              tone: { type: Type.STRING }
            }
          }
        }
      }
    }
  };

  if (!isCompatible && !isLowQuotaMode) {
    config.thinkingConfig = { thinkingBudget: 16384 };
  }
  
  const response = await ai.models.generateContent({
    model: activeModel,
    contents: `你现在是一名世界顶级导演（思维对标《哪吒》《大鱼海棠》）。请将剧本片段转化为工业级分镜蓝图。

【🎬 核心指令：全中文输出规范】
- 严禁输出任何英文，包括电影术语必须转化为中文（例如：Long shot -> 远景，Zoom in -> 推镜头）。
- 场景底图描述（scenePrompt）需展现电影感美术设定，包含纹理、天气、光线。

【🎥 视觉资产标注规范】
1. **场景资产锁定**：
   - 提取本组镜头的核心背景场景，生成纯环境中文描述，不得包含任何人物动作。
2. **绘画黄金标注（imagePrompt）**：
   - 识别场景名和出场角色名，强制使用【 】包裹。
3. **情绪与场面标记（action）**：
   - 在描述中，若涉及顶级视效（如震撼、宏伟、澎湃、极致）等词，必须使用 [[词汇]] 标注。

【Sora 10秒工业级动力学模板】
- [0-3s] 物理惯性衔接：描述起始状态，确保与前一镜头的物理连续性。
- [3-7s] 核心爆发与对白嵌入：执行“△”指令，描述说话时的口型与情绪导致的物理反馈。
- [7-10s] 预留动势动线：描述结尾的镜头位移或角色惯性，为下一镜头的衔接做准备。

全部输出必须为中文。

当前剧本段落内容:
<<< ${segment} >>>`,
    config: config
  });

  return JSON.parse(extractJson(response.text));
};

export const generateStoryboard = async (plot: string, onProgress?: (msg: string) => void): Promise<StoryboardResponse> => {
  onProgress?.("正在地毯式扫描剧本，锁定核心指令并锁定系统提示块...");
  const segments = await segmentPlot(plot);
  const groups: ShotGroup[] = [];
  let totalShots = 0;
  for (let i = 0; i < segments.length; i++) {
    onProgress?.(`正在构思第 ${i + 1} / ${segments.length} 幕：同步场景资产与情绪高亮...`);
    const group = await generateShotGroup(segments[i], i === 0);
    groups.push(group);
    totalShots += group.shots.length;
  }
  return {
    totalShots,
    keyVisualConcept: groups[0]?.reasoning.substring(0, 100) + "...",
    groups
  };
};
