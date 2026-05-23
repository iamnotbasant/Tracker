import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize the Gemini Client lazily to prevent server crashes if the API key is not present initially
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// API endpoint for AI Blueprints/Coaching reports
app.post("/api/coach", async (req, res) => {
  try {
    const { logs, categoryConfig } = req.body;
    
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: "Gemini API key is not configured yet. Please configure the GEMINI_API_KEY in the Secrets panel."
      });
    }

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return res.json({
        analysis: "### No Log Data Yet!\nOnce you log a few emotional friction check-ins on the **Blueprint** page, I will analyze your mood, energy levels, resistance patterns, and daily actions to map your personal Mind Blueprint."
      });
    }

    const payloadText = JSON.stringify({ logs, categoryConfig }, null, 2);

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the Mind Blueprint AI Behavioural Friction Coach, an empathetic, smart, and insightful guide.
We are tracking 5 key areas of friction and mental alignment:
1. Mood
2. Energy
3. Resistance (Blocked, Pushing, Flow)
4. Fear (Anxiety, Worried, Fearless)
5. Activities (Work, Social Media, Exercise, etc.)

Below is a history of user logs containing timestamps, moods, energy states, resistance levels, fears, and active tasks. Look closely for psychological and energetic correlations:
- Identify if specific activities consistently trigger high resistance ('Blocked') or anxiety.
- Look at weather daily streaks, consistency, or average energy.
- Match how transition activities (like Social Media or Meals) affect subsequent moods/energy.
- Highlight positive setups (e.g., "When you log 'Exercise' your energy enters 'Beast' mode and resistance transitions to 'Flow'").

Provide highly customized feedback:
1. A warm, friendly greeting referencing their current log count.
2. **3 Key Correlations Found** (highlight specific patterns or triggers in bullet points).
3. **2 Flow Recommendations** (actionable and low-friction behavioral adjustments they can try starting today).

Keep the tone encouraging, clear, wise, and slightly playful. Strictly avoid clinical or dry clinical jargon, but show true, high-value behavioral awareness. Use beautiful Markdown formatting with clear spacing.

Log data:
${payloadText}
`,
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Gemini Coach API Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch response from Gemini." });
  }
});

// Setup Vite Dev server logic vs Static Production output
async function bindVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite Dev Middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving Static Assets from dist/ in production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mind Blueprint Server currently running on http://localhost:${PORT}`);
  });
}

bindVite().catch(err => {
  console.error("Vite server loader failed:", err);
});
