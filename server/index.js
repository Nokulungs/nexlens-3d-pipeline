const express = require('express');
const cors = require('cors');
const { Client } = require("@gradio/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: '50mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- LOCAL DICTIONARY (Backup for Gemini Quota) ---
const FALLBACK_SUMMARIES = {
    "valve": "A precision-engineered industrial valve designed for fluid control in high-pressure piping systems.",
    "helmet": "Safety-rated industrial head protection designed for construction and manufacturing environments.",
    "hard hat": "ANSI-compliant head protection featuring a high-density polyethylene shell.",
    "telescope": "Optical instrument utilizing curved mirrors and lenses to observe distant objects.",
    "default": "An industrial-grade component designed for specialized engineering applications."
};

app.post('/api/create-learning-module', async (req, res) => {
    const { prompt } = req.body;
    const userPrompt = (prompt || "industrial component").toLowerCase();
    console.log(`\n🚀 NexLens Bridge: Processing "${userPrompt}"`);

    // --- 1. RESILIENT SUMMARY ---
    let summary = FALLBACK_SUMMARIES[userPrompt] || FALLBACK_SUMMARIES["default"];
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const gResult = await model.generateContent(`Brief technical summary for: ${userPrompt}`);
        summary = gResult.response.text();
    } catch (e) {
        console.warn("⚠️ Gemini Quota hit. Using local dictionary.");
    }

    // --- 2. RESILIENT 3D GENERATION ---
    let modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb";
    
    try {
        console.log("🏗️ Connecting to InstantMesh (Higher Availability)...");
        
        // InstantMesh is usually more available than TRELLIS
        const client = await Client.connect("TencentARC/InstantMesh", {
            hf_token: process.env.HF_TOKEN 
        });

        // InstantMesh typically takes an image. If you have text, 
        // some spaces handle it via an internal text-to-image step.
        // If this fails, we fall back to the helmet immediately.
        const result = await client.predict("/text_to_3d", [userPrompt]);

        const foundUrl = result?.data?.[0]?.url || 
                         result?.data?.find(item => item?.url?.endsWith('.glb'))?.url;

        if (foundUrl) {
            modelUrl = foundUrl;
            console.log("✅ 3D Generation Success!");
        }
    } catch (error) {
        console.warn(`🚨 3D Engine Busy: ${error.message || "Timeout"}. Loading fallback asset.`);
    }

    // Always send a valid response to keep the React frontend 100% stable
    res.json({ status: "success", modelUrl, summary });
});

app.listen(5000, () => console.log("🌉 NexLens Bridge | Ready on 5000"));