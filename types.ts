
export interface Comment {
  id: string;
  userName: string;
  userRole: string;
  text: string;
  timestamp: number;
}

export interface AnimationShot {
  shotNo: string;      // 镜号
  duration: string;    // 时长
  action: string;      // 镜头文案 (含动作、表情、前中后景描述)
  audio: string;       // 语音分镜 (台词/内心独白)
  imagePrompt: string; // 图片提示词
  videoPrompt: string; // 视频提示词 (Sora)
  soundEffects: string; // 音效
  lighting: string;    // 光影 (辅助导演参考)
  tone: string;        // 色调 (辅助导演参考)
  characters: string[]; // 出场人物
  comments?: Comment[]; // 协作评论
}

export interface ShotGroup {
  eventTitle: string;
  description: string;
  reasoning: string; // 导演的推理/构思过程
  sceneName: string; // 场景名称
  scenePrompt: string; // 纯场景环境提示词 (不含人物)
  shots: AnimationShot[];
}

export interface StoryboardResponse {
  totalShots: number;
  keyVisualConcept: string;
  groups: ShotGroup[];
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isOnline: boolean;
}
