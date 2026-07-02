import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext.jsx';
import { api } from '../utils/api.js';
import './GMMConsole.css';

export default function GMMConsole() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, switchClient, activeClient } = useClient();

  const [step, setStep] = useState(1);
  const [productFocus, setProductFocus] = useState('');
  const [viralUrl, setViralUrl] = useState('');
  
  const [isResearching, setIsResearching] = useState(false);
  const [researchData, setResearchData] = useState({ news: '', hooks: '' });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  
  const [activeTab, setActiveTab] = useState('instagram_reel');

  useEffect(() => {
    if (clientId && clients.length > 0) {
      if (!activeClient || activeClient.id !== clientId) {
        switchClient(clientId);
      }
    }
  }, [clientId, clients, activeClient, switchClient]);

  const handleStartResearch = async () => {
    if (!productFocus && !viralUrl) return;
    setIsResearching(true);
    try {
      const { job_id } = await api.gmmResearch({
        client_id: clientId,
        product_focus: productFocus,
        viral_url: viralUrl
      });
      
      const poll = setInterval(async () => {
        try {
          const status = await api.getJobStatus(job_id);
          if (status.status === 'completed') {
            clearInterval(poll);
            setResearchData({ news: status.result.news, hooks: status.result.hooks });
            setStep(2);
            setIsResearching(false);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            throw new Error(status.error);
          }
        } catch (err) {
          clearInterval(poll);
          console.error(err);
          alert('Failed to run research. Check console for details.');
          setIsResearching(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to start research. Check console for details.');
      setIsResearching(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { job_id } = await api.gmmGenerate({
        client_id: clientId,
        product_focus: productFocus,
        news: researchData.news,
        hooks: researchData.hooks
      });
      
      const poll = setInterval(async () => {
        try {
          const status = await api.getJobStatus(job_id);
          if (status.status === 'completed') {
            clearInterval(poll);
            setGeneratedContent(status.result);
            setStep(3);
            setIsGenerating(false);
          } else if (status.status === 'failed') {
            clearInterval(poll);
            throw new Error(status.error);
          }
        } catch (err) {
          clearInterval(poll);
          console.error(err);
          alert('Failed to generate content. Check console for details.');
          setIsGenerating(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to start generation. Check console for details.');
      setIsGenerating(false);
    }
  };

  const handleSaveToVault = async () => {
    try {
      await api.saveToVault({
        title: `${activeClient.brand_name} - ${productFocus}`,
        format: 'GMM Omni-Channel',
        content: generatedContent
      });
      alert('Saved to Vault successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save to Vault.');
    }
  };

  if (!activeClient) {
    return <div className="gmm-container"><p>Loading client data...</p></div>;
  }

  return (
    <div className="gmm-container">
      <header className="gmm-header">
        <div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/clients')}>← Back to Clients</button>
          <h1 className="gmm-title">Grest Marketing <span className="gradient-text">Manager</span></h1>
          <p className="gmm-subtitle">AI-Powered Campaign Console for <strong>{activeClient.brand_name}</strong></p>
        </div>
        
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Setup</div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Review</div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Output</div>
        </div>
      </header>

      <div style={{ padding: '0 2rem 1rem 2rem', display: 'flex', gap: '1rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/linkedin')}
          style={{ background: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)', border: 'none' }}
        >
          <span style={{ marginRight: '0.5rem' }}>💼</span> Open LinkedIn Agent
        </button>
      </div>

      <div className="gmm-content">
        {step === 1 && (
          <div className="gmm-panel fade-in">
            <h2>Campaign Setup</h2>
            <div className="form-group">
              <label>Product or Campaign Focus *</label>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="e.g., iPhone 15 Pro Max Refurbished Launch"
                value={productFocus}
                onChange={e => setProductFocus(e.target.value)}
              />
              <small>What specific product or event are we marketing today?</small>
            </div>
            
            <div className="form-group">
              <label>Viral URL (Optional)</label>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="https://instagram.com/reel/..."
                value={viralUrl}
                onChange={e => setViralUrl(e.target.value)}
              />
              <small>Paste a competitor's viral reel or a trending video to extract its hook structure.</small>
            </div>
            
            <button 
              className="btn btn-primary btn-large" 
              onClick={handleStartResearch}
              disabled={isResearching || (!productFocus && !viralUrl)}
            >
              {isResearching ? 'Agent is Researching...' : 'Start AI Research'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="gmm-panel fade-in">
            <h2>Human-in-the-Loop Review</h2>
            <p className="review-instruction">The AI has gathered real-time news and viral hooks. Review and edit them before generation.</p>
            
            <div className="review-grid">
              <div className="form-group">
                <label>Latest Product News & Sentiment</label>
                <textarea 
                  className="glass-input review-textarea" 
                  value={researchData.news}
                  onChange={e => setResearchData({...researchData, news: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Extracted Viral Hooks & Structures</label>
                <textarea 
                  className="glass-input review-textarea" 
                  value={researchData.hooks}
                  onChange={e => setResearchData({...researchData, hooks: e.target.value})}
                />
              </div>
            </div>

            <div className="action-row">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button 
                className="btn btn-primary btn-large" 
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Writing Omni-Channel Content...' : 'Approve & Generate Content'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && generatedContent && (
          <div className="gmm-panel fade-in">
            <h2>Omni-Channel Content Ready</h2>
            
            <div className="tabs">
              <button className={`tab ${activeTab === 'instagram_reel' ? 'active' : ''}`} onClick={() => setActiveTab('instagram_reel')}>Instagram Reel</button>
              <button className={`tab ${activeTab === 'youtube_video' ? 'active' : ''}`} onClick={() => setActiveTab('youtube_video')}>YouTube Video</button>
              <button className={`tab ${activeTab === 'facebook_post' ? 'active' : ''}`} onClick={() => setActiveTab('facebook_post')}>Facebook Post</button>
            </div>
            
            <div className="tab-content">
              <textarea 
                className="glass-input final-output" 
                readOnly 
                value={generatedContent[activeTab] || 'No content generated.'}
              />
              {activeTab === 'facebook_post' && generatedContent.image_prompt && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--accent-purple)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-purple)' }}>AI Image Prompt (Midjourney/DALL-E)</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{generatedContent.image_prompt}</p>
                </div>
              )}
            </div>
            
            <div className="action-row">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>Back to Review</button>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={handleSaveToVault}>Save to Vault</button>
                <button className="btn btn-primary" onClick={() => {
                  navigator.clipboard.writeText(generatedContent[activeTab]);
                  alert('Copied to clipboard!');
                }}>Copy to Clipboard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
