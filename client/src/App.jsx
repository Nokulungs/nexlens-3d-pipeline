import React, { useState } from 'react';
import axios from 'axios';
import { Box, Search, Cpu, BookOpen, Download, Activity, Shield, Zap, Grid, Sparkles, ArrowRight } from 'lucide-react';
import '@google/model-viewer';
import './App.css';

const App = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('https://nexlens-3d-pipeline.onrender.com/api/create-learning-module', {
        prompt: prompt.toLowerCase()
      });
      setData(res.data);
    } catch (err) {
      console.error("Bridge Connection Failed. Is the server running on port 5000?");
      alert("Backend connection failed. Please check your terminal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nex-container">
      {/* Animated Background */}
      <div className="bg-gradient">
        <div className="grid-pattern"></div>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      {/* HEADER SECTION */}
      <header className="nex-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <Cpu size={28} />
            </div>
            <h1>NEX<span>LENS</span></h1>
            <div className="badge">AI STUDIO</div>
          </div>
          <div className={`status-pill ${loading ? 'active' : ''}`}>
            <div className="pulse-dot"></div>
            <Activity size={14} className={loading ? 'spin' : ''} />
            <span>{loading ? 'SYNTHESIZING...' : 'SYSTEM READY'}</span>
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD */}
      <main className="nex-main">

        {/* LEFT PANEL: INPUT & 3D VIEWER */}
        <div className="left-panel glass-panel">
          <div className="search-card">
            <div className="input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Enter component (e.g., valve, helmet, telescope)..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="generate-btn"
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  BUILDING...
                </>
              ) : (
                <>
                  GENERATE
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="viewport">
            {loading && (
              <div className="overlay">
                <div className="scanner-line"></div>
                <div className="loading-content">
                  <div className="loader-cube">
                    <div className="cube-face"></div>
                    <div className="cube-face"></div>
                    <div className="cube-face"></div>
                    <div className="cube-face"></div>
                    <div className="cube-face"></div>
                    <div className="cube-face"></div>
                  </div>
                  <p>MAPPING GEOMETRY...</p>
                  <span className="loading-detail">Rendering volumetric data</span>
                </div>
              </div>
            )}

            {!loading && data && (
              <div className="model-view-active">
                <div className="model-meta">
                  <div className="meta-left">
                    <Zap size={12} />
                    <span>OBJECT_ID: {prompt.toUpperCase()}</span>
                  </div>
                  <div className="meta-right">
                    <Shield size={12} />
                    <span>STATUS: RENDER_SUCCESS</span>
                  </div>
                </div>
                <model-viewer
                  src={data.modelUrl}
                  alt="Industrial 3D Component"
                  auto-rotate
                  camera-controls
                  shadow-intensity="1"
                  environment-image="neutral"
                  style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                >
                </model-viewer>
              </div>
            )}

            {!loading && !data && (
              <div className="idle-state">
                <div className="idle-icon">
                  <Grid size={56} strokeWidth={1.2} />
                </div>
                <h3>AWAITING COMMAND SIGNAL</h3>
                <p>Enter a component name to initialize 3D visualization</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: TECHNICAL DATA */}
        <aside className="right-panel glass-panel">
          <div className="info-card">
            <div className="card-header">
              <div className="header-accent"></div>
              <BookOpen size={18} />
              <span>TECHNICAL SPECIFICATIONS</span>
              {data && <div className="live-badge">LIVE</div>}
            </div>
            <div className="card-body">
              {data ? (
                <div className="summary-text">
                  <div className="quote-mark">"</div>
                  <p>{data.summary}</p>
                </div>
              ) : (
                <div className="placeholder-state">
                  <Sparkles size={32} strokeWidth={1.2} />
                  <p>Enter a prompt to initialize the neural data stream.</p>
                </div>
              )}
            </div>
            {data && (
              <div className="action-area">
                <button className="download-btn" onClick={() => window.open(data.modelUrl)}>
                  <Download size={16} /> EXPORT .GLB
                </button>
                <div className="file-info">High-fidelity mesh • 2.4MB</div>
              </div>
            )}
          </div>

          {/* Additional Info Card */}
          {data && (
            <div className="spec-card">
              <div className="spec-item">
                <span className="spec-label">Polygon Count</span>
                <span className="spec-value">~12.4k tris</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Texture Resolution</span>
                <span className="spec-value">2K PBR</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Format</span>
                <span className="spec-value">glTF 2.0</span>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default App;