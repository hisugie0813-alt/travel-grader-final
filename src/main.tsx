import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { PenTool, ClipboardCheck, Lightbulb } from 'lucide-react';

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      alert("에러 발생: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-8 flex items-center gap-2">
        <PenTool /> 기행문 AI 채점기
      </h1>
      
      {!result ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <textarea 
            className="w-full h-64 p-4 border rounded-lg mb-4"
            placeholder="기행문을 입력하세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button 
            onClick={handleGrade}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold"
          >
            {loading ? "AI 분석 중..." : "채점 시작하기"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="text-5xl font-bold text-blue-600">{result.totalScore}점</div>
            <p className="mt-4 text-gray-600">{result.overallFeedback}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.criteria.map((c: any) => (
              <div key={c.id} className="bg-white p-4 rounded-lg border-l-4 border-blue-400 shadow-sm">
                <div className="font-bold">{c.title} ({c.score}/{c.maxScore})</div>
                <p className="text-sm text-gray-500">{c.reason}</p>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
              <Lightbulb /> 95점을 받으려면?
            </h3>
            <p className="text-yellow-900">{result.howToGet95}</p>
          </div>
          <button onClick={() => setResult(null)} className="w-full text-blue-600 font-bold">다시 작성하기</button>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
