'use client';

import { useState } from 'react';
import Background3D from '@/components/Background3D';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [platform, setPlatform] = useState<'tt' | 'ig' | 'yt'>('tt');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const switchPlatform = (p: 'tt' | 'ig' | 'yt') => {
    setPlatform(p);
    setResult(null);
    setError('');
  };

  const getPlaceholder = () => {
    switch(platform) {
      case 'tt': return 'Paste TikTok link here… (e.g. https://vm.tiktok.com/…)';
      case 'ig': return 'Paste Instagram link here… (e.g. https://www.instagram.com/reel/…)';
      case 'yt': return 'Paste YouTube link here… (e.g. https://www.youtube.com/watch?v=…)';
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch (e) {
      console.error('Clipboard access denied');
    }
  };

  const extractYouTubeId = (url: string) => {
    try {
      const u = new URL(url);
      if(u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
      if(u.hostname.includes('youtube.com')){
        const v = u.searchParams.get('v');
        if(v) return v;
        const m = u.pathname.match(/\/(?:shorts|embed|v)\/([^/?&]+)/);
        if(m) return m[1];
      }
    } catch(e){}
    return null;
  };

  const handleDownload = async () => {
    if (!url) {
      setError('Please paste a link to continue.');
      return;
    }
    
    setError('');
    setResult(null);
    setLoading(true);
    setProgress(20);
    setProgressText('Fetching media info…');

    try {
      let endpoint = '';
      if (platform === 'tt') endpoint = `/api/download/tiktok?url=${encodeURIComponent(url)}`;
      if (platform === 'ig') endpoint = `/api/download/instagram?url=${encodeURIComponent(url)}`;
      if (platform === 'yt') {
        const videoId = extractYouTubeId(url);
        if (!videoId) throw new Error('Invalid YouTube URL');
        endpoint = `/api/download/youtube?videoId=${encodeURIComponent(videoId)}`;
      }

      setProgress(50);
      setProgressText('Contacting API…');

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch media');
      }

      setProgress(90);
      setProgressText('Processing…');

      try {
        // Basic tracking in Supabase
        await supabase.from('download_history').insert([{ platform, url }]);
      } catch(e) {
        // Ignore supabase errors for now
      }

      let normalisedData = {
        title: 'Media Ready',
        thumbnail: '',
        links: [] as any[]
      };

      if (platform === 'tt') {
        normalisedData.title = data.title || 'TikTok Video';
        normalisedData.thumbnail = data.cover || data.origin_cover;
        if (data.play) normalisedData.links.push({ type: 'MP4', label: 'Video (No Watermark)', url: data.play });
        if (data.music) normalisedData.links.push({ type: 'MP3', label: 'Audio', url: data.music });
      } else if (platform === 'ig') {
        normalisedData.title = 'Instagram Media';
        // Needs adjustment based on actual IG API schema from RapidAPI
        if (data.media_url) normalisedData.links.push({ type: 'MP4', label: 'Video', url: data.media_url });
        if (data.thumbnail_url) normalisedData.thumbnail = data.thumbnail_url;
      } else if (platform === 'yt') {
         normalisedData.title = data.title || 'YouTube Video';
         if (data.thumbnail) normalisedData.thumbnail = data.thumbnail;
         if (data.url) normalisedData.links.push({ type: 'MP4', label: 'Video', url: data.url });
      }

      setResult(normalisedData);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Background3D />
      <div className="wrap">
        <nav>
          <div className="logo">Save<span>It</span></div>
          <div className="nav-pills">
            <span>100% Free</span>
            <span>No Login</span>
            <span>No Watermark</span>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-badge">
            TikTok · Instagram · YouTube
          </div>
          <h1>Download <em>Any Video</em><br/>From Anywhere</h1>
          <p>HD quality, no watermark, no login. Save TikToks, Reels, Instagram Stories, YouTube videos &amp; more — instantly.</p>
        </section>

        <div className="tabs">
          <button className={`tab-btn tt ${platform === 'tt' ? 'active' : ''}`} onClick={() => switchPlatform('tt')}>TikTok</button>
          <button className={`tab-btn ig ${platform === 'ig' ? 'active' : ''}`} onClick={() => switchPlatform('ig')}>Instagram</button>
          <button className={`tab-btn yt ${platform === 'yt' ? 'active' : ''}`} onClick={() => switchPlatform('yt')}>YouTube</button>
        </div>

        <div className="search-wrap">
          <div className="search-box">
            <input 
              type="text" 
              placeholder={getPlaceholder()} 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
            />
            <button className="paste-btn" onClick={pasteFromClipboard}>Paste</button>
            <button className="dl-btn" onClick={handleDownload} disabled={loading}>
              {loading ? 'Fetching…' : 'Download ↓'}
            </button>
          </div>

          {loading && (
            <div className="progress-wrap">
              <div className="progress-bar-bg"><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>
              <div className="progress-txt">{progressText}</div>
            </div>
          )}

          {error && (
            <div className="error-msg show">
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="result-card show">
              <div className="result-inner">
                <div className="result-thumb">
                  {result.thumbnail ? <img src={result.thumbnail} alt="thumbnail" /> : <div className="thumb-placeholder">Video</div>}
                </div>
                <div className="result-info">
                  <div className="result-title">{result.title}</div>
                  <div className="dl-options">
                    {result.links.map((link: any, idx: number) => (
                      <div className="dl-option" key={idx}>
                        <div className="dl-option-info">
                          <span className={`dl-type-badge badge-${link.type.toLowerCase()}`}>{link.type}</span>
                          <span className="dl-quality">{link.label}</span>
                        </div>
                        <a className="dl-link" href={link.url} target="_blank" rel="noopener noreferrer">Download</a>
                      </div>
                    ))}
                    {result.links.length === 0 && <span style={{fontSize:'12px', color:'var(--muted)'}}>No links found in response. Try another video.</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="features">
          <div className="section-label">Why SaveIt</div>
          <div className="section-title">Everything you need, nothing you don't</div>
          <div className="features-grid">
            <div className="feat-card">
              <h3>No Watermark</h3>
              <p>Download TikTok videos clean — no logo, no username stamp. Pure original content.</p>
            </div>
            <div className="feat-card">
              <h3>MP3 Audio Extract</h3>
              <p>Extract the audio track from any TikTok or Instagram video as an MP3 file.</p>
            </div>
            <div className="feat-card">
              <h3>HD &amp; 4K Quality</h3>
              <p>Get the highest available resolution — Full HD, 2K, or 4K where the source supports it.</p>
            </div>
            <div className="feat-card">
              <h3>Anonymous &amp; Private</h3>
              <p>No login required. We never store URLs, download history, or personal data.</p>
            </div>
          </div>
        </section>

        <footer>
          <p>SaveIt is an independent tool — not affiliated with TikTok, Instagram, Meta, or YouTube.</p>
        </footer>
      </div>
    </>
  );
}
