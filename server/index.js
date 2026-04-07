const express = require('express');
const cors = require('cors');
const { Client } = require("@gradio/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path'); // Added for static file handling if needed
require('dotenv').config();

const app = express();

// --- 🌐 DYNAMIC CORS CONFIGURATION ---
// This allows both your local testing and your future production site
const allowedOrigins = [
    "http://localhost:5173",          // Local Vite
    "https://your-app.vercel.app",    // CHANGE THIS to your actual Vercel URL later
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json({ limit: '50mb' }));

// Validate API Key Existence
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FALLBACK_SUMMARIES = {
    "valve": "A precision-engineered industrial valve designed for fluid control in high-pressure piping systems.",
    "helmet": "Safety-rated industrial head protection designed for construction and manufacturing environments.",
    "hard hat": "ANSI-compliant head protection featuring a high-density polyethylene shell.",
    "telescope": "Optical instrument utilizing curved mirrors and lenses to observe distant objects.",
    "default": "I am a 3D learning content pipeline for construction. If the AI engine is currently busy synthesizing, I provide technical documentation for industrial components like helmets and valves."
};

app.post('/api/create-learning-module', async (req, res) => {
    const { prompt } = req.body;
    const userPrompt = (prompt || "industrial component").toLowerCase();
    
    // Check if the query is construction related (Your Smart Filter)
    const constructionKeywords = ["helmet", "hat", "valve", "wrench", "drill", "excavator", "tool", "safety"];
    const isConstructionRelated = constructionKeywords.some(keyword => userPrompt.includes(keyword));

    console.log(`\n🚀 NexLens Pipeline: Processing "${userPrompt}"`);

    // --- 🚦 DOMAIN PROTECTION LOGIC ---
    if (!isConstructionRelated) {
        return res.json({
            status: "error",
            modelUrl: null,
            summary: "I am a 3D learning content pipeline for construction. Currently, I only process industrial tools and safety equipment. Would you like to generate a helmet?"
        });
    }

    // --- 1. RESILIENT SUMMARY ---
    let summary = FALLBACK_SUMMARIES[userPrompt] || FALLBACK_SUMMARIES["default"];
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Note: Using 1.5-flash for better stability
        const gResult = await model.generateContent(`Brief technical summary for a construction professional regarding: ${userPrompt}`);
        summary = gResult.response.text();
    } catch (e) {
        console.warn("⚠️ Gemini API unavailable. Using fallback description.");
    }

    // --- 2. 3D GENERATION BRIDGE ---
    // Default fallback asset (The Damaged Helmet)
    let modelUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb";
    
    try {
        const client = await Client.connect("TencentARC/InstantMesh", {
            hf_token: process.env.HF_TOKEN 
        });

        // Some Spaces require specific paths; /text_to_3d is common for generative hubs
        const result = await client.predict("/text_to_3d", [userPrompt]);

        const foundUrl = result?.data?.[0]?.url || 
                         result?.data?.find(item => item?.url?.endsWith('.glb'))?.url;

        if (foundUrl) {
            modelUrl = foundUrl;
            console.log("✅ 3D Generation Success!");
        }
    } catch (error) {
        console.warn(`🚨 3D Engine Busy or Restricted. Providing technical docs + fallback model.`);
    }

    res.json({ status: "success", modelUrl, summary });
});

// --- 🌍 PRODUCTION PORT CONFIGURATION ---
// Render and other hosts inject the PORT variable. We listen on 0.0.0.0 for external access.
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌉 NexLens Bridge | Active on Port ${PORT}`);
    console.log(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
});