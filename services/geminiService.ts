
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

/**
 * 第一步：剧本结构分析 (Scene Breaking)
 * 使用 Flash 模型快速将长剧本拆解为逻辑独立的段落
 */
export const segmentPlot = async (plot: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `你是一名资深剧作监制。请将以下长剧本拆解为 3-5 个逻辑完整的“核心事件段落”。
每一个段落应包含完整的情节起承转合。

【规则】
1. 仅输出一个 JSON 数组，包含每个段落的剧本正文。
2. 严禁改变原意。

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
    return [plot]; // 降级处理
  }
};

/**
 * 第二步：专业分镜生成
 * 针对拆解后的段落进行深度导演思维分析
 */
export const generateShotGroup = async (segment: string, isFirst: boolean): Promise<ShotGroup> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `你现在是一名享誉全球的顶级动画导演（如《哪吒之魔童降世》导演级思维）。请针对以下剧本段落，生成极致专业的动画分镜表。

【⚠️核心限制 - 绝对遵守】
1. 全过程必须使用【简体中文】。严禁出现任何英文单词。
2. 将“技术参数”、“表演推理”以及“人物对话/台词”全部深度融合进“分帧步进描述”中，不准输出独立段落或参数表。

剧本内容段落:
<<< ${segment} >>>

【导演指令 - 视频提示词 (videoPrompt) 工业级规格】
必须严格遵循以下结构生成视频指令：

1. 标题头：视频提示词（Sora）：

2. 阶段化分帧描述（总长不超过10秒）：
   - 【缓冲起手阶段】[0-3秒]：必须描述为“起手帧描述”。此阶段故事动作相对静止，用于稳定首帧。详细刻画：环境全景、当前天气状态（如夕阳漫反射）、初始构图、人物的初始静态微表情、衣物静止时的褶皱感、发丝的垂落状态。衔接上一镜头结尾。
   - 【核心演绎阶段】[3秒以后]：真正的故事逻辑、核心动作变化、冲突爆发。此处必须根据剧情推理并直接植入“人物对话”或“内心独白”。

3. 每段分帧（3-5段）必须深度融合的要素：
   - [对话融合]：直接在动作描述中体现对话，例如：“[3-6秒] [主角名]猛地转头，眼神中透出绝望，嘴唇颤抖着嘶吼道：‘（台词内容）’，对话语气充满愤怒...”。
   - [动作细节]：人物微表情（眼球震颤、肌肉抽动）、衣服褶皱随动作的动态起伏、发丝受力飘动的弧度、道具的高精细节互动。
   - [背景动态]：风力强弱变化、光影随位移的明暗交替、云雾烟尘的物理模拟颗粒感流动。
   - [镜头运动]：明确描述摄像机的推拉、平移、跟随或摇镜轨迹。
   - [风格与气象]：维持“2D动漫、高画质、电影感”风格。具体描述当前昼夜及天气对画面的物理影响。
   - [衔接逻辑]：明确当前秒段如何与前后镜头/秒段进行 0.5-1.5秒的动作或光影衔接。

【输出结构】
返回包含 eventTitle, reasoning, shots 数组的 JSON 对象。`,
    config: {
      thinkingConfig: { thinkingBudget: 16384 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["eventTitle", "reasoning", "shots"],
        properties: {
          eventTitle: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          shots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["shotNo", "duration", "action", "imagePrompt", "videoPrompt", "soundEffects"],
              properties: {
                shotNo: { type: Type.STRING },
                duration: { type: Type.STRING },
                action: { type: Type.STRING },
                audio: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                videoPrompt: { type: Type.STRING, description: "全中文融合式分帧视频提示词，含0-3秒起手帧及植入对话" },
                soundEffects: { type: Type.STRING },
                lighting: { type: Type.STRING },
                tone: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(extractJson(response.text));
};

export const generateStoryboard = async (plot: string, onProgress?: (msg: string) => void): Promise<StoryboardResponse> => {
  onProgress?.("正在进行剧本结构化拆解...");
  const segments = await segmentPlot(plot);
  
  const groups: ShotGroup[] = [];
  let totalShots = 0;
  
  for (let i = 0; i < segments.length; i++) {
    onProgress?.(`正在构思第 ${i + 1} / ${segments.length} 幕分镜...`);
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
