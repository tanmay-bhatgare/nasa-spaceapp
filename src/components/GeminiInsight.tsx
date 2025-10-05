import React, { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API;
const MODEL = "gemini-2.5-flash"; // or whichever is available in your API access
interface GeminiInsightProps {
  trigger?: number; // optional if you want refresh later
}

const GeminiInsight: React.FC<GeminiInsightProps> = () => {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGemini = async () => {
    setLoading(true);
    setError(null);

    const prompt = localStorage.getItem("geminiData");
    const systemPrompt =
      localStorage.getItem("geminiSystemPrompt") ||
      "You are a weather data analyst. Summarize the given data concisely and insightfully.";

    if (!prompt) {
      setError("No data found in localStorage!");
      setLoading(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL });

      const fullPrompt = `${systemPrompt}\n\nData:\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();

      setResponse(text);
    } catch (err) {
      console.error("Gemini API Error:", err);
      setError(err.message || "Failed to fetch Gemini response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-4xl mx-auto mt-6 p-4 border rounded-xl shadow-md bg-white">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        Gemini Insight 💡
      </h2>

      <button
        onClick={runGemini}
        className="mb-4 px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-md hover:opacity-90"
      >
        Summarize Data
      </button>

      {loading && <p className="text-blue-500">Summarizing...</p>}
      {error && <p className="text-red-500">❌ {error}</p>}

      {!loading && !error && response && (
        <textarea
          value={response}
          readOnly
          className="w-full h-64 border p-3 rounded-md resize-none bg-gray-50 text-gray-800"
        />
      )}
    </div>
  );
};

export default GeminiInsight;
