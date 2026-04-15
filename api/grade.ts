export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send("Method not allowed");
  
  const apiKey = process.env.GEMINI_API_KEY;
  const { text } = req.body;

  try {
    // 이번에는 모델 이름을 'gemini-1.5-flash'로 아주 정확하게 고정했습니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `초등학생 기행문 채점 전문가로서 다음 글을 채점하고 JSON으로만 답하세요.
    { "totalScore": 0, "criteria": [{"id":1, "title":"기준", "maxScore":5, "score":0, "reason":"이유"}], "overallFeedback": "평", "howToGet95": "팁" }
    [글]: ${text}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "AI 오류");

    const aiText = data.candidates[0].content.parts[0].text;
    const json = aiText.substring(aiText.indexOf('{'), aiText.lastIndexOf('}') + 1);
    return res.status(200).json(JSON.parse(json));
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
