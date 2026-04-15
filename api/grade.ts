export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send("Method not allowed");
  
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { text } = req.body;

  if (!apiKey) return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });

  // 시도할 모델 목록 (가장 확실한 순서대로)
  const models = ["gemini-1.5-flash", "gemini-pro"];
  
  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const prompt = `초등학생 기행문 채점 전문가로서 다음 글을 채점하고 JSON으로만 답하세요.
      { "totalScore": 0, "criteria": [{"id":1, "title":"기준", "maxScore":5, "score":0, "reason":"이유"}], "overallFeedback": "평", "howToGet95": "팁" }
      [글]: ${text}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      
      // 성공하면 바로 결과 반환!
      if (response.ok) {
        const aiText = data.candidates[0].content.parts[0].text;
        const jsonStart = aiText.indexOf('{');
        const jsonEnd = aiText.lastIndexOf('}') + 1;
        return res.status(200).json(JSON.parse(aiText.substring(jsonStart, jsonEnd)));
      }

      // 404 에러(모델 없음)인 경우에만 다음 모델로 넘어갑니다.
      if (response.status !== 404) {
        throw new Error(data.error?.message || "AI 서버 응답 오류");
      }

    } catch (e: any) {
      // 마지막 모델까지 실패했을 때만 에러를 보냅니다.
      if (modelName === "gemini-pro") {
        return res.status(500).json({ 
          error: "모든 모델 시도 실패", 
          details: e.message 
        });
      }
    }
  }
}
