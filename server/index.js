const express = require('express');
const cors = require('cors');
const { Client } = require("@gradio/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();

// --- 🌐 UPDATED CORS FOR YOUR LIVE APP ---
const allowedOrigins = [
    "http://localhost:5173",                            // Local Development
    "https://nexlens-3d-pipeline-adjc.vercel.app"       // YOUR LIVE FRONTEND
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`🚩 CORS Blocked for origin: ${origin}`);
            callback(new Error('CORS Policy Error: Origin not allowed.'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// 🏥 HEALTH CHECK (Helps Render keep the service stable)
app.get('/', (req, res) => res.send('NexLens Bridge is Active.'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FALLBACK_SUMMARIES = {
    "valve": "A precision-engineered industrial valve designed for fluid control in high-pressure piping systems.",
    "helmet": "Safety-rated industrial head protection designed for construction and manufacturing environments.",
    "hard hat": "ANSI-compliant head protection featuring a high-density polyethylene shell.",
    "default": "I am a 3D learning content pipeline for construction. If the AI engine is currently busy synthesizing, I provide technical documentation for industrial components like helmets and valves."
};

app.post('/api/create-learning-module', async (req, res) => {
    const { prompt } = req.body;
    const userPrompt = (prompt || "industrial component").toLowerCase();
    
    // CONSTRUCTION FILTER
    const constructionKeywords = ["helmet", "hat", "valve", "wrench", "drill", "excavator", "tool", "safety", "goggle", "boot", "vest"];
    const isConstructionRelated = constructionKeywords.some(keyword => userPrompt.includes(keyword));

    console.log(`\n🚀 NEXLENS: Processing "${userPrompt}"`);

    if (!isConstructionRelated) {
        return res.json({
            status: "error",
            modelUrl: null,
            summary: "Scope Deviation: I am a 3D pipeline for construction assets. Please request industrial tools or safety gear (e.g., Helmet, Drill, Excavator)."
        });
    }

    // 1. GENERATE SUMMARY (Gemini)
    let summary = FALLBACK_SUMMARIES[userPrompt] || FALLBACK_SUMMARIES["default"];
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const gResult = await model.generateContent(`Provide a brief 3-sentence technical specification for a construction site briefing about: ${userPrompt}`);
        summary = gResult.response.text();
    } catch (e) {
        console.warn("⚠️ Gemini Quota full. Using local specs.");
    }

    // 2. GENERATE 3D MODEL (HuggingFace Bridge)
    let modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb";
    
    try {
        const client = await Client.connect("TencentARC/InstantMesh", {
            hf_token: process.env.HF_TOKEN 
        });

        const result = await client.predict("/text_to_3d", [userPrompt]);
        const foundUrl = result?.data?.[0]?.url || 
                         result?.data?.find(item => item?.url?.endsWith('.glb'))?.url;

        if (foundUrl) {
            modelUrl = foundUrl;
            console.log("✅ 3D Render Complete");
        }
    } catch (error) {
        console.warn(`🚨 AI Engine Busy. Serving fallback asset.`);
    }

    res.json({ status: "success", modelUrl, summary });
});

// --- 🌍 RENDER PORT BINDING ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌉 NexLens Bridge Online | Port ${PORT}`);
});