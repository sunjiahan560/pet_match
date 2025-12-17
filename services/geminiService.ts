import { GoogleGenAI, Type } from "@google/genai";
import { Answer, PetRecommendation, ApiSettings, ChatMessage, RecommendationResponse } from "../types";
import { DEFAULT_SYSTEM_PROMPT } from "../constants";

const SETTINGS_KEY = 'petmatch_api_settings';

const getSettings = (): ApiSettings | null => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Helper: Normalize API Endpoint
const normalizeEndpoint = (inputUrl: string): string => {
  let url = inputUrl.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (url.endsWith('/chat/completions')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/chat/completions`;
  }
  return `${url}/v1/chat/completions`;
};

// Robust JSON Extractor
const extractJson = (text: string): string => {
  const jsonBlockPattern = /```json\s*([\s\S]*?)\s*```/i;
  const matchJson = text.match(jsonBlockPattern);
  if (matchJson && matchJson[1]) return matchJson[1];

  const genericBlockPattern = /```\s*([\s\S]*?)\s*```/;
  const matchGeneric = text.match(genericBlockPattern);
  if (matchGeneric && matchGeneric[1]) return matchGeneric[1];

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }

  return text;
};

export const testApiConnection = async (settings: ApiSettings): Promise<void> => {
  if (!settings.endpoint || !settings.apiKey) {
      throw new Error("请先填写完整的 API 端点和密钥");
  }

  const normalizedEndpoint = normalizeEndpoint(settings.endpoint);

  try {
    console.log("Testing connection to:", normalizedEndpoint);
    const response = await fetch(normalizedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        max_tokens: 5,
        stream: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      try {
          const jsonError = JSON.parse(text);
          if (jsonError.error && jsonError.error.message) {
             throw new Error(`API 错误: ${jsonError.error.message}`);
          }
      } catch(e) {
          // ignore
      }
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${text.slice(0, 100)}`);
    }
    await response.json();
  } catch (e) {
    console.error("Test connection failed", e);
    if (e instanceof TypeError && e.message.includes("Failed to fetch")) {
        throw new Error(`连接失败: 可能是跨域限制(CORS)或地址错误。\n尝试请求地址: ${normalizedEndpoint}`);
    }
    throw new Error(e instanceof Error ? e.message : "网络连接失败");
  }
};

export const getPetRecommendation = async (answers: Answer[]): Promise<PetRecommendation[]> => {
  const settings = getSettings();
  
  const userProfile = answers.map(a => `- ${a.questionId}: ${a.optionLabel}`).join('\n');
  const userPrompt = `
    用户资料:
    ${userProfile}

    请根据上述资料，分析用户的居住环境、时间、预算、宠物大小偏好和性格偏好。
    
    特别注意：
    - 如果用户有过敏情况，必须推荐低敏宠物。
    - 如果用户无法忍受噪音，不要推荐爱叫的品种。
    - 如果用户不想打理毛发，推荐短毛品种。
    - 注意用户的体型偏好（小型/中型/大型），推荐符合该体型的动物。
    如果是新手且时间少，不要推荐高难度宠物。
    
    请输出 JSON，包含一个 "recommendations" 数组，提供 **3个不同的** 推荐方案。
    **重要提示：除 englishName 外，所有输出内容必须完全使用简体中文。**
  `;

  // --- MODE 1: Custom API (OpenAI Compatible) ---
  if (settings && settings.apiKey && settings.endpoint) {
    const normalizedEndpoint = normalizeEndpoint(settings.endpoint);
    try {
      console.log("Using Custom API for Recommendation");
      let sysPrompt = settings.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      
      const response = await fetch(normalizedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Custom API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const cleanedJson = extractJson(content);
      const result = JSON.parse(cleanedJson) as RecommendationResponse;
      return result.recommendations;

    } catch (e) {
      console.error("Custom API Call Failed:", e);
      let msg = e instanceof Error ? e.message : '未知错误';
      if (msg.includes("Failed to fetch")) {
          msg = `无法连接到服务器。请检查 API 地址 (CORS)。尝试请求: ${normalizedEndpoint}`;
      }
      throw new Error(`自定义 API 调用失败: ${msg}`);
    }
  }

  // --- MODE 2: Default Google Gemini ---
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  const geminiPrompt = `
    ${DEFAULT_SYSTEM_PROMPT}
    
    ${userPrompt}
  `;

  const petProperties = {
    name: { type: Type.STRING },
    englishName: { type: Type.STRING, description: "The English scientific or common name of the pet for image generation." },
    species: { type: Type.STRING },
    description: { type: Type.STRING },
    matchReason: { type: Type.STRING },
    careLevel: { type: Type.STRING },
    exerciseNeeds: { type: Type.STRING },
    estimatedCost: { type: Type.STRING },
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          reason: { type: Type.STRING }
        }
      }
    },
    careGuide: {
      type: Type.OBJECT,
      properties: {
          diet: { type: Type.STRING },
          grooming: { type: Type.STRING },
          exercise: { type: Type.STRING },
          health: { type: Type.STRING },
          training: { type: Type.STRING },
          dailySchedule: { type: Type.STRING },
      }
    }
  };

  const response = await ai.models.generateContent({
    model: model,
    contents: geminiPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: petProperties
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No recommendation received from Gemini.");
  }

  try {
    const result = JSON.parse(text) as RecommendationResponse;
    return result.recommendations;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Invalid response format.");
  }
};

// --- CHAT FUNCTIONALITY ---

export const sendChatResponse = async (
    messages: ChatMessage[], 
    petName: string, 
    petDescription: string
): Promise<string> => {
    const settings = getSettings();
    const systemInstruction = `你是一个友好的 AI 宠物助手。用户刚刚被推荐了"${petName}" (${petDescription})。
    请回答用户关于这个宠物的问题。
    - 语气亲切、专业。
    - 尽量使用中文。
    - 回答要简洁实用。
    `;

    const apiMessages = [
        { role: 'system', content: systemInstruction },
        ...messages.map(m => ({
            role: m.role,
            content: m.content
        }))
    ];

    // --- Custom API ---
    if (settings && settings.apiKey && settings.endpoint) {
        const normalizedEndpoint = normalizeEndpoint(settings.endpoint);
        try {
            const response = await fetch(normalizedEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: apiMessages,
                    stream: false
                })
            });

            if (!response.ok) throw new Error("Chat request failed");
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "抱歉，我走神了，请再说一遍。";
        } catch (e) {
            console.error(e);
            return "抱歉，连接聊天服务失败。";
        }
    }

    // --- Gemini API ---
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemInstruction,
            },
            history: messages.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        });

        const lastUserMsg = messages[messages.length - 1].content;
        const result = await chat.sendMessage({ message: lastUserMsg });
        return result.text || "我没有听清。";
    } catch (e) {
        console.error(e);
        return "AI 服务暂时不可用。";
    }
};

export const getPetImage = async (petName: string, description: string, englishName?: string): Promise<string | null> => {
  // Use English name if available for better accuracy, otherwise fall back to Chinese name
  const subjectName = englishName || petName;
  
  console.log(`Generating image for: ${subjectName} (Original: ${petName})`);

  // Strategy: 
  // 1. Try Gemini Image Generation (if API key is present).
  // 2. If Gemini fails or no key, use Pollinations.ai (Free, Fast, No-Auth).
  
  // Try Gemini First
  if (process.env.API_KEY) {
    try {
        console.log("Attempting Gemini Image Generation...");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash-image";
        // Simplified prompt focusing on the subject name to avoid confusion
        const prompt = `A high-quality, adorable, professional studio photography style photo of a ${subjectName}. The animal is isolated or in a natural setting. Soft lighting. Focus on the ${subjectName}.`;

        const response = await ai.models.generateContent({ model: model, contents: prompt });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (error) {
        console.warn("Gemini image generation failed/skipped, falling back to Pollinations.", error);
    }
  }

  // Fallback: Pollinations.ai
  // This is much faster and works without a key.
  try {
      console.log("Using Pollinations.ai fallback...");
      // Add 'pet' to context to help ensure an animal is generated even if the name is obscure
      const prompt = encodeURIComponent(`high quality photo of a cute ${subjectName} pet, studio lighting, 4k, realistic`);
      const seed = Math.floor(Math.random() * 1000);
      return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=600&nologo=true&seed=${seed}&model=flux`;
  } catch (e) {
      console.error("All image generation methods failed.");
      return null;
  }
};