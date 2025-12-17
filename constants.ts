import { Question } from './types';

export const DEFAULT_SYSTEM_PROMPT = `你是一位资深的宠物行为专家和匹配顾问。请根据用户的问卷回答，推荐 **3个** 最适合他们的宠物（具体到品种）。

**重要规则：**
1. **语言要求**：除 \`englishName\` 字段外，所有返回内容（描述、理由、指南等）必须严格使用**简体中文**。
2. **JSON 格式**：请务必严格按照以下 JSON 格式输出结果，不要包含任何额外的 Markdown 标记或解释文字。
3. **多样性**：这3个推荐应该是不同的品种，最好能覆盖用户可能感兴趣的不同方向（例如：一个最完美的匹配，一个更有趣的选择，一个更容易打理的选择）。

{
  "recommendations": [
    {
      "name": "宠物具体品种名称(必须中文, 如 '金鱼')",
      "englishName": "宠物英文学名(用于生成图片, 如 'Goldfish', 'Golden Retriever')",
      "species": "物种 (如 '猫', '狗', '鱼', '鸟')",
      "description": "一段吸引人的描述(中文)",
      "matchReason": "详细的匹配理由(中文)",
      "careLevel": "护理难度 (低/中/高)",
      "exerciseNeeds": "运动需求描述(中文)",
      "estimatedCost": "预估月开销描述(中文)",
      "alternatives": [
        { "name": "类似品种1(中文)", "reason": "推荐理由" }
      ],
      "careGuide": {
        "diet": "饮食建议与禁忌(中文)",
        "grooming": "毛发护理与清洁建议(中文)",
        "exercise": "具体的运动与娱乐方式(中文)",
        "health": "常见遗传病与健康注意事项(中文)",
        "training": "新手训练技巧(中文)",
        "dailySchedule": "建议的每日作息安排(中文)"
      }
    }
  ]
}`;

export const QUESTIONS: Question[] = [
  {
    id: 'living_space',
    text: '您的居住环境是怎样的？',
    options: [
      { id: 'small_apt', label: '小型公寓/单间' },
      { id: 'large_apt', label: '大型公寓/大平层' },
      { id: 'house_yard', label: '带院子的别墅/住宅' },
      { id: 'farm', label: '广阔的乡村/农场环境' },
    ],
  },
  {
    id: 'size_preference',
    text: '您偏好哪种体型的宠物？',
    options: [
       { id: 'small', label: '小型 (如仓鼠、猫、小型犬)' },
       { id: 'medium', label: '中型 (如柯基、柴犬)' },
       { id: 'large', label: '大型 (如金毛、阿拉斯加)' },
       { id: 'no_pref', label: '体型不重要，看眼缘' },
    ],
  },
  {
    id: 'activity_level',
    text: '您平时的活动量如何？',
    options: [
      { id: 'low', label: '宅家一族，喜欢安静' },
      { id: 'moderate', label: '偶尔散步，适度运动' },
      { id: 'high', label: '非常活跃，经常跑步或户外探险' },
    ],
  },
  {
    id: 'time_commitment',
    text: '您每天能为宠物投入多少陪伴时间？',
    options: [
      { id: 'little', label: '很少 (少于 1 小时)' },
      { id: 'medium', label: '适中 (1-3 小时)' },
      { id: 'lot', label: '很多 (3 小时以上或全天在家)' },
    ],
  },
  {
    id: 'allergies',
    text: '您或家人是否对宠物毛发过敏？',
    options: [
      { id: 'yes', label: '是的，严重过敏 (需要低敏宠物)' },
      { id: 'mild', label: '轻微过敏，可以接受' },
      { id: 'no', label: '完全不过敏' },
    ],
  },
  {
    id: 'noise_tolerance',
    text: '您对噪音的容忍度如何？',
    options: [
      { id: 'quiet', label: '喜欢绝对安静，不能接受吵闹' },
      { id: 'some', label: '偶尔叫几声没关系' },
      { id: 'loud', label: '热闹一点挺好的' },
    ],
  },
  {
    id: 'grooming',
    text: '您愿意花多少精力打理宠物的毛发？',
    options: [
      { id: 'low', label: '越省事越好 (短毛/无毛)' },
      { id: 'medium', label: '每周梳理一次' },
      { id: 'high', label: '不介意每天梳理或定期去美容院' },
    ],
  },
  {
    id: 'experience',
    text: '您有养宠物的经验吗？',
    options: [
      { id: 'none', label: '我是新手' },
      { id: 'some', label: '有过一些经验' },
      { id: 'expert', label: '我是资深铲屎官' },
    ],
  },
  {
    id: 'household',
    text: '您的家庭成员情况？',
    options: [
      { id: 'single', label: '独居' },
      { id: 'couple', label: '情侣/夫妻' },
      { id: 'kids', label: '有小孩' },
      { id: 'other_pets', label: '已有其他宠物' },
    ],
  },
  {
    id: 'budget',
    text: '您每月的养宠预算大概是多少？',
    options: [
      { id: 'low', label: '经济型 (500元以下)' },
      { id: 'medium', label: '舒适型 (500-2000元)' },
      { id: 'high', label: '富养型 (2000元以上)' },
    ],
  },
  {
    id: 'preference',
    text: '您更倾向于哪种类型的互动？',
    options: [
      { id: 'cuddly', label: '粘人，喜欢抱抱' },
      { id: 'independent', label: '独立，互不打扰' },
      { id: 'playful', label: '活泼好动，一起玩耍' },
      { id: 'smart', label: '聪明，喜欢互动训练' },
    ],
  },
];