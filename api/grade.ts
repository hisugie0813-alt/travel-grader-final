export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send("Method not allowed");
  
  // 1. API 키의 앞뒤 공백을 자동으로 제거합니다. (복사 붙여넣기 실수 방지)
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { text } = req.body;

  if (!apiKey) return res.status(500).json({ error: "Vercel 설정에서 API 키를 찾을 수 없습니다." });

  try {
    // 2. 주소를 v1beta 대신 정식 버전인 v1으로 변경합니다.
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `초등학생 기행문 채점 전문가로서 다음 글을 채점하고 JSON으로만 답하세요.
    { "totalScore": 0, "criteria": [{"id":1, "title":"기준", "maxScore":5, "score":0, "reason":"이유"}], "overallFeedback": "평", "howToGet95": "팁" }
    [글]: ${text}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }] 
        // 에러를 유발했던 복잡한 설정(generationConfig)은 모두 뺐습니다.
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // 만약 여기서 또 'not found'가 뜬다면, 아래 '체크리스트'를 확인해야 합니다.
      throw new Error(data.error?.message || "AI 서버 응답 오류");
    }

    const aiText = data.candidates[0].content.parts[0].text;
    const json = aiText.substring(aiText.indexOf('{'), aiText.lastIndexOf('}') + 1);
    return res.status(200).json(JSON.parse(json));
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
