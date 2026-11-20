import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy-initialized or cached GoogleGenAI instance
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Deep Thinking Engineering Analysis Endpoint
app.post('/api/ai/deep-reason', async (req, res) => {
  try {
    const { prompt, subjectId, kinematicsData, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A valid text prompt is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is missing. Please set your API key in the AI Studio Settings > Secrets panel.',
      });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are the lead aerospace and mechanical precision engineering analyst in the AetherForge 3D Computational Laboratory.
You possess world-class expertise in:
- High-precision horological kinematics, tourbillon escapements, gear trains, and epicyclic planetary ratios.
- Turbomachinery, thermodynamic Brayton cycles, aerofoil blade aerodynamics, centrifugal stresses, and variable nozzles.
- Planetary rover mobility, rocker-bogie kinematics, regolith traction, terramechanics, and robotic manipulator inverse kinematics.
- Materials science, PBR optical and mechanical properties, titanium alloys, silicon balances, and finite-element stress behavior.

When analyzing the 3D subject and the user's inquiry:
1. Conduct deep, rigorous engineering reasoning.
2. Provide exact mechanical formulations, calculations, gear ratios, stress vectors, or thermodynamic efficiencies where relevant.
3. Structure your analysis with clear engineering sections (e.g., Kinematic Architecture, Mechanical & Thermal Stress Analysis, Material Science & Tolerances, Optimization Recommendations).
4. Tone: Rigorous, insightful, authoritative, and direct.`;

    const userContent = `Subject ID: ${subjectId || 'chronos-tourbillon'}
Current Kinematics & 3D Parameters:
${JSON.stringify(kinematicsData || {}, null, 2)}
Additional Context:
${context || 'Interactive 3D model exploration'}

User Engineering Inquiry:
${prompt}`;

    const startTime = Date.now();

    // Call gemini-4-argon with thinkingLevel: ThinkingLevel.HIGH as mandated
    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: userContent,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    const elapsedMs = Date.now() - startTime;
    const analysisText = response.text || 'No response generated.';

    return res.json({
      success: true,
      model: 'gemini-4-argon',
      thinkingLevel: 'HIGH',
      elapsedMs,
      analysis: analysisText,
    });
  } catch (error: any) {
    console.error('Error executing Gemini High Thinking:', error);
    const errorMessage = error?.message || 'Failed to generate engineering analysis.';
    const status = error?.status || 500;
    return res.status(status).json({
      error: errorMessage,
      details: error?.toString?.() || 'Unknown error occurred.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AetherForge Server running on http://0.0.0.0:${port} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
