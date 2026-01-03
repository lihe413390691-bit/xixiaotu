
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
  return {
    flash: localStorage.getItem('导演_MODEL_FLASH') || 'gemini-3-flash-preview',
    pro: localStorage.getItem('导演_MODEL_PRO') || 'gemini-3-pro-preview',
    isLowQuotaMode: localStorage.getItem('导演_LOW_QUOTA_MODE') === 'true'
  };
};

const getApiClient = () => {
  const customKey = localStorage.getItem('导演_API_KEY');
  let customEndpoint = localStorage.getItem('导演_API_URL');
  const apiKey = customKey?.trim() || process.env.API_KEY || '';
  
  let baseUrl: string | undefined = undefined;
  if (customEndpoint && customEndpoint.trim() !== '') {
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

export const testApiConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!localStorage.getItem('导演_API_KEY')) {
    return { success: false, message: "尚未配置 API Key" };
  }
  try {
    const ai = getApiClient();
    const { flash } = getModelConfig();
    await ai.models.generateContent({
      model: flash,
      contents: "ping",
      config: { maxOutputTokens: 1 }
    });
    return { success: true, message: "连接成功" };
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
    contents: `你是一名世界顶级的剧作监制。请详细阅读剧本，将其拆解为 3-5 个核心事件段落。

【严控指令】
1. 禁止私自添加剧本以外的任何剧情、台词或人物。
2. 特别标注剧本中的 OS (Off-Screen) 和对白内容，确保 100% 还原。
3. 全部使用中文输出。

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
  const isCustom = !!localStorage.getItem('导演_API_URL');
  const { pro, flash, isLowQuotaMode } = getModelConfig();
  const activeModel = isLowQuotaMode ? flash : pro;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      required: ["eventTitle", "reasoning", "shots"],
      properties: {
        eventTitle: { type: Type.STRING },
        reasoning: { type: Type.STRING, description: "导演对剧本深度推理，侧重于人物 OS 心理动机与环境压力的关联分析" },
        shots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["shotNo", "duration", "action", "audio", "imagePrompt", "videoPrompt", "soundEffects", "lighting", "tone"],
            properties: {
              shotNo: { type: Type.STRING },
              duration: { type: Type.STRING, description: "固定为10s" },
              action: { type: Type.STRING, description: "镜头细节描述。标注是否为震撼镜头或空景转场。" },
              audio: { type: Type.STRING, description: "原文台词/OS，严禁任何修改。" },
              imagePrompt: { type: Type.STRING, description: "单帧关键帧。人物和场景名用【】。" },
              videoPrompt: { type: Type.STRING, description: "10s动态提示词。必须包含 [0-3s], [3-7s], [7-10s] 三个演化阶段，且三阶段画面必须紧密关联。必须嵌入原文台词并视觉化环境音。" },
              soundEffects: { type: Type.STRING },
              lighting: { type: Type.STRING },
              tone: { type: Type.STRING }
            }
          }
        }
      }
    }
  };

  if (!isCustom && !isLowQuotaMode) {
    config.thinkingConfig = { thinkingBudget: 16384 };
  }
  
  const response = await ai.models.generateContent({
    model: activeModel,
    contents: `你现在是一名电影导演（代表作《哪吒》《大鱼海棠》）。请将以下剧本转化为工业级分镜。

【🎬 导演最高指令 - 极致连贯性与忠诚度】
1. **剧本绝对还原**：严禁修改任何人物对话内容（含 OS）和剧情。你唯一的职责是将文字转化为极富感染力的视觉提示。
2. **10秒三帧深度关联（核心升级）**：
   - 每一个 videoPrompt 必须严格按照三个阶段撰写：
     - **[0-3s] 动态起势与衔接**：承接上一镜头的运动惯性，设定本镜头的视觉基调。
     - **[3-7s] 核心叙事与同步**：嵌入原文台词文本，描述角色说话时的具体神态细节（唇动、眼神聚焦、呼吸感），实现音画高度同步。
     - **[7-10s] 余韵演化与动线**：画面向下一阶段自然推演，预留出动作走向，严防跳帧。
3. **OS (内心独白) 的心理外化**：
   - OS 是内心的震颤。通过推理，将其转化为可见的视觉现象。例如：角色内心绝望时，周围的影调应在高光处产生撕裂感，或通过极细微的眼底颤动来表达。
4. **空景转场与震撼镜头**：
   - 你有权在叙事节奏需要处插入“震撼镜头”（极致的构图美学）或“空景转场”（利用环境物象如云、水、尘埃传递情绪），以确保剪辑点丝滑。
5. **音效视觉化**：描述环境音对画面产生的物理影响（如：厚重的重低音导致空气纹理的视觉扭曲）。
6. **全中文输出**。

当前剧本段落内容:
<<< ${segment} >>>`,
    config: config
  });

  return JSON.parse(extractJson(response.text));
};

export const generateStoryboard = async (plot: string, onProgress?: (msg: string) => void): Promise<StoryboardResponse> => {
  onProgress?.("正在深度研读剧本，并规划 10s 三帧叙事动力学架构...");
  const segments = await segmentPlot(plot);
  const groups: ShotGroup[] = [];
  let totalShots = 0;
  for (let i = 0; i < segments.length; i++) {
    onProgress?.(`正在构思第 ${i + 1} / ${segments.length} 幕：强化 OS 推理与丝滑转场中...`);
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
