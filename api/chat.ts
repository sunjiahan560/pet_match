import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  try {
    const response = await fetch(
      'https://new.12ai.org/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat', // ⭐ 推荐先用这个，成功率最高
          messages,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Server Error',
      detail: error?.message,
    });
  }
}
