
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardResponse } from "../types";

const extractJson = (text: string): string => {
  // 1. 优先匹配 Markdown 块
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match = codeBlockRegex.exec(text);
  if (match && match[1]) return match[1].trim();

  // 2. 兜底方案：寻找第一个 { 和最后一个 }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }
  
  return text.trim();
};

export const generateStoryboard = async (plot: string): Promise<StoryboardResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `你现在是一名世界级的动画导演和分镜专家（思维风格参考《哪吒之魔童降世》、《大鱼海棠》）。
请根据以下剧情内容，进行深度的导演思维分析，并生成一份极其专业的【全中文动画分镜表】。

剧情内容:
<<< ${plot} >>>

【导演指令 - 必须严格执行】
1. **全中文输出**：所有字段必须使用中文。
2. **深度推理**：在推理字段中，请详细分析人物的心理动机、镜头的情绪张力。**特别要求**：在推理过程中，需明确设定角色对话时的情感基调、语速和语气。
3. **语音分镜（台词）格式要求**：对话必须包含角色名和具体的情感/语气提示。
   格式必须为：**角色名（情感语气）：台词内容**。
   例如：“弟子甲（鄙夷）：江狱！别挣扎了！” 或 “江狱（虚弱自嘲）：呵，竟然是这种结局...”
4. **视觉风格**：设定一个宏大且细腻的视觉基调，并在“视觉核心概念”中详细阐述。
5. **格式规范**：
   - 镜号：例如 1-1, 1-2...
   - 镜头文案：需包含（场景；前景；中景：动作+表情+情绪；后景；故事描述）。
   - 人物：名字请用 ** 包裹。
   - 提示词细化：即使是提示词，也要用优美的中文描述：构图、光效、材质、粒子动态、环境等。

【输出结构】
必须返回包含 totalShots, keyVisualConcept, groups 数组的完整 JSON 对象。严禁出现任何英文。`,
    config: {
      thinkingConfig: { thinkingBudget: 16384 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["totalShots", "keyVisualConcept", "groups"],
        properties: {
          totalShots: { type: Type.NUMBER },
          keyVisualConcept: { type: Type.STRING },
          groups: {
            type: Type.ARRAY,
            minItems: 1,
            items: {
              type: Type.OBJECT,
              required: ["eventTitle", "reasoning", "shots"],
              properties: {
                eventTitle: { type: Type.STRING },
                description: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                shots: {
                  type: Type.ARRAY,
                  minItems: 1,
                  items: {
                    type: Type.OBJECT,
                    required: ["shotNo", "duration", "action", "imagePrompt", "videoPrompt", "soundEffects"],
                    properties: {
                      shotNo: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      action: { type: Type.STRING },
                      audio: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING },
                      videoPrompt: { type: Type.STRING },
                      soundEffects: { type: Type.STRING },
                      lighting: { type: Type.STRING },
                      tone: { type: Type.STRING },
                      characters: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const rawText = response.text;
  if (!rawText) throw new Error("AI 构思失败，未返回内容。");

  try {
    const jsonString = extractJson(rawText);
    const parsed = JSON.parse(jsonString);
    
    if (!parsed.groups || !Array.isArray(parsed.groups)) {
      throw new Error("模型生成的 JSON 结构缺失 'groups' 数组。");
    }
    
    return parsed as StoryboardResponse;
  } catch (err: any) {
    console.error("解析失败原始文本:", rawText);
    throw new Error(`分镜解析失败: ${err.message}`);
  }
};
