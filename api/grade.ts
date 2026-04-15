export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send("Method not allowed");
  
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { text } = req.body;

  if (!apiKey) return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });

  try {
    // 1. 가장 빠르고 안정적인 주소와 모델 하나만 지정합니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `초등학생 기행문 채점 전문가로서 다음 글을 채점하고 JSON으로만 답하세요.
    { "totalScore": 0, "criteria": [{"id":1, "title":"기준", "maxScore":5, "score":0, "reason":"이유"}], "overallFeedback": "평", "howToGet95": "팁" }
    [글]: ${text}`;

    // 2. 8초가 지나면 자동으로 연결을 끊도록 설정합니다. (Vercel 10초 제한 방지)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await response.json();
    
    if (!response.ok) {
      // 여기서 에러가 나면 'not found'인지 다른 이유인지 정확히 알려줍니다.
      return res.status(response.status).json({ 
        error: `AI 서버 응답 오류 (${response.status})`,
        details: data.error?.message || "알 수 없는 오류"
      });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const jsonStart = aiText.indexOf('{');
    const jsonEnd = aiText.lastIndexOf('}') + 1;
    return res.status(200).json(JSON.parse(aiText.substring(jsonStart, jsonEnd)));

  } catch (e: any) {
    // 시간이 초과되었을 때의 메시지입니다.
    const message = e.name === 'AbortError' ? "AI 응답 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해 주세요." : e.message;
    return res.status(500).json({ error: message });
  }
}
