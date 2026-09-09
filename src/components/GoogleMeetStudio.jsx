// MediTrust AI — Google Meet Consultation Studio
// The dominant visual component: embeds REAL Google Meet for the consultation.
// When Google credentials are configured → opens Meet in a popup window and tracks the session.
// When credentials are unavailable → shows clear configuration guidance + demo transcript simulation.

import { useState, useEffect, useRef, useCallback } from 'react';
import { isGoogleConfigured, getConfigurationStatus, simulateLiveTranscription } from '../services/googleMeet';
import { CONSULTATION_STATUS } from '../types/consultation';

export default function GoogleMeetStudio({
  consultation,
  patient,
  onStartConsultation,
  onEndConsultation,
  onTranscriptReady,
  transcriptLines = [],
  onTranscriptLineAdd,
}) {
  const [meetWindowOpen, setMeetWindowOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [meetPopupClosed, setMeetPopupClosed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const timerRef = useRef(null);
  const stopSimRef = useRef(null);
  const meetWindowRef = useRef(null);
  const pollRef = useRef(null);

  const googleConfig = getConfigurationStatus();
  const meetUrl = consultation?.meetingUrl || '';
  const meetCode = consultation?.meetingCode || '';
  const googleReady = isGoogleConfigured();
  const isDemoSource = consultation?.source === 'demo' || !googleReady;

  const status = consultation?.status || CONSULTATION_STATUS.SCHEDULED;
  const isLive = status === CONSULTATION_STATUS.ACTIVE;

  // ── Timer ──
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    } else {
      setElapsedTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  // ── Poll for Meet window close ──
  useEffect(() => {
    if (meetWindowOpen && meetWindowRef.current) {
      pollRef.current = setInterval(() => {
        if (meetWindowRef.current?.closed) {
          clearInterval(pollRef.current);
          setMeetWindowOpen(false);
          setMeetPopupClosed(true);
        }
      }, 1500);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [meetWindowOpen]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // ── Join Google Meet (open real Meet in popup window) ──
  const handleJoinMeet = () => {
    if (!meetUrl) return;

    // Open Google Meet in a sized popup window
    const width = 1100;
    const height = 700;
    const left = Math.round((window.screen.width - width) / 2);
    const top = Math.round((window.screen.height - height) / 2);

    const meetWindow = window.open(
      meetUrl,
      'MediTrustGoogleMeet',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=1`
    );

    if (meetWindow) {
      meetWindowRef.current = meetWindow;
      setMeetWindowOpen(true);
      setMeetPopupClosed(false);
    } else {
      // Popup blocked — fall back to new tab
      window.open(meetUrl, '_blank', 'noopener');
      setMeetWindowOpen(true);
    }

    // Start the consultation lifecycle
    onStartConsultation?.();
  };

  // ── Start Demo Mode Consultation ──
  const handleStartDemo = () => {
    setIsDemo(true);
    setDemoRunning(true);
    onStartConsultation?.();

    const stop = simulateLiveTranscription((line, index) => {
      if (line === null) {
        setDemoRunning(false);
        onTranscriptReady?.();
      } else {
        onTranscriptLineAdd?.(line);
      }
    });
    stopSimRef.current = stop;
  };

  // ── End Consultation ──
  const handleEnd = () => {
    // Close the Meet popup if still open
    if (meetWindowRef.current && !meetWindowRef.current.closed) {
      meetWindowRef.current.close();
    }
    meetWindowRef.current = null;
    setMeetWindowOpen(false);
    setMeetPopupClosed(false);

    // Stop demo simulation if running
    if (stopSimRef.current) {
      stopSimRef.current();
      stopSimRef.current = null;
    }
    setDemoRunning(false);
    setIsDemo(false);

    onEndConsultation?.();
  };

  // ── Refocus Meet window ──
  const handleFocusMeet = () => {
    if (meetWindowRef.current && !meetWindowRef.current.closed) {
      meetWindowRef.current.focus();
    }
  };

  // ── Rejoin after popup closed ──
  const handleRejoinMeet = () => {
    setMeetPopupClosed(false);
    handleJoinMeet();
  };

  return (
    <div className="meet-studio">
      {/* ══════════ Configuration Banner ══════════ */}
      {isDemoSource && !isLive && status === CONSULTATION_STATUS.SCHEDULED && (
        <div className="meet-config-banner">
          <div className="meet-config-banner-content">
            <i className="fa-solid fa-info-circle" />
            <span>
              Google Meet credentials not configured. 
              <strong> Demo mode</strong> simulates transcription — real Meet requires setup.
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowConfig(!showConfig)} style={{ marginLeft: 'auto', color: 'inherit' }}>
              <i className={`fa-solid fa-chevron-${showConfig ? 'up' : 'down'}`} /> {showConfig ? 'Hide' : 'Setup Guide'}
            </button>
          </div>
          {showConfig && (
            <div className="meet-config-details">
              <div style={{ fontSize: '.82rem', lineHeight: 1.8 }}>
                <strong>To connect real Google Meet:</strong>
                <ol style={{ margin: '8px 0 0 20px' }}>
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                  <li>Enable <strong>Google Meet API</strong> and <strong>Google Calendar API</strong></li>
                  <li>Create <strong>OAuth 2.0 credentials</strong> (Web application)</li>
                  <li>Add authorized redirect URIs for your domain</li>
                  <li>Add these to <code>.env.local</code>:
                    <pre style={{ background: 'rgba(0,0,0,0.04)', padding: '8px 12px', borderRadius: 6, margin: '6px 0', fontSize: '.78rem' }}>
{`VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key`}
                    </pre>
                  </li>
                  <li>Restart the dev server</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ Meeting Header ══════════ */}
      <div className="meet-header">
        <div className="meet-header-left">
          <div className="meet-google-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="1" y="4" width="15" height="16" rx="3" fill="#1a73e8"/>
              <path d="M16 9l5-3v12l-5-3V9z" fill="#ea4335"/>
              <path d="M6 10.5l3 1.5-3 1.5v-3z" fill="#fff"/>
            </svg>
            <span>Google Meet</span>
          </div>
          {meetCode && <span className="meet-code">{meetCode}</span>}
          {isDemoSource && <span className="badge badge-amber" style={{ fontSize: '.65rem' }}>Demo</span>}
        </div>
        <div className="meet-header-right">
          {isLive && (
            <>
              <div className="meet-timer">
                <div className="recording-dot" />
                {formatTime(elapsedTime)}
              </div>
              <span className="badge badge-red"><i className="fa-solid fa-circle" style={{ fontSize: '.45rem' }} /> Live</span>
            </>
          )}
          {status === CONSULTATION_STATUS.ENDED && (
            <span className="badge badge-blue"><i className="fa-solid fa-check" /> Ended</span>
          )}
        </div>
      </div>

      {/* ══════════ MAIN VIDEO STAGE ══════════ */}
      <div className="meet-video-stage">

        {/* ─── STATE: Consultation Active + Meet Window Open ─── */}
        {isLive && meetWindowOpen && !isDemoSource && (
          <div className="meet-in-call">
            <div className="meet-in-call-icon">
              <div className="meet-pulse-ring" />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="4" width="15" height="16" rx="3" fill="#1a73e8"/>
                <path d="M16 9l5-3v12l-5-3V9z" fill="#34a853"/>
                <path d="M6 10.5l3 1.5-3 1.5v-3z" fill="#fff"/>
              </svg>
            </div>
            <div className="meet-in-call-text">Google Meet consultation in progress</div>
            <div className="meet-in-call-patient">
              with <strong>{patient?.name || 'Patient'}</strong> · {formatTime(elapsedTime)}
            </div>
            <div className="meet-in-call-actions">
              <button className="btn btn-primary" onClick={handleFocusMeet}>
                <i className="fa-solid fa-external-link" /> Return to Meet Window
              </button>
            </div>
            <div className="meet-in-call-hint">
              <i className="fa-solid fa-info-circle" />
              The Google Meet call is running in a separate window. When done, click "End Consultation" below.
            </div>
          </div>
        )}

        {/* ─── STATE: Consultation Active + Meet Window Closed (re-join prompt) ─── */}
        {isLive && meetPopupClosed && !isDemoSource && (
          <div className="meet-in-call">
            <div className="meet-in-call-icon" style={{ opacity: 0.6 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="4" width="15" height="16" rx="3" fill="#5f6368"/>
                <path d="M16 9l5-3v12l-5-3V9z" fill="#9aa0a6"/>
                <path d="M6 10.5l3 1.5-3 1.5v-3z" fill="#fff"/>
              </svg>
            </div>
            <div className="meet-in-call-text">Google Meet window was closed</div>
            <div className="meet-in-call-patient">
              Consultation with <strong>{patient?.name || 'Patient'}</strong> is still active · {formatTime(elapsedTime)}
            </div>
            <div className="meet-in-call-actions">
              <button className="btn btn-primary" onClick={handleRejoinMeet}>
                <i className="fa-solid fa-video" /> Rejoin Meet
              </button>
              <button className="btn btn-outline" onClick={handleEnd}>
                <i className="fa-solid fa-phone-slash" /> End Consultation
              </button>
            </div>
          </div>
        )}

        {/* ─── STATE: Demo mode in progress (simulated transcription) ─── */}
        {isLive && (isDemoSource || demoRunning) && (
          <div className="meet-demo-active">
            <div className="meet-demo-header">
              <span className="badge badge-amber">
                <i className="fa-solid fa-flask" /> Demo Simulation
              </span>
            </div>
            <div className="meet-demo-body">
              <div className="meet-demo-icon">
                <div className="meet-pulse-ring" />
                <i className="fa-solid fa-stethoscope" style={{ fontSize: '2rem', color: 'var(--primary)' }} />
              </div>
              <div className="meet-demo-text">
                Simulating doctor-patient consultation
              </div>
              <div className="meet-demo-patient">
                with <strong>{patient?.name || 'Patient'}</strong> · {formatTime(elapsedTime)}
              </div>
              {/* Live waveform */}
              <div className="meet-waveform" style={{ marginTop: 20 }}>
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="meet-waveform-bar" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
              <div className="meet-transcript-count" style={{ position: 'relative', marginTop: 16 }}>
                <i className="fa-solid fa-closed-captioning" />
                {transcriptLines.length} lines transcribed
              </div>
            </div>
          </div>
        )}

        {/* ─── STATE: Idle / Ready to Start ─── */}
        {!isLive && status === CONSULTATION_STATUS.SCHEDULED && (
          <div className="meet-video-idle">
            <div className="meet-idle-icon">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="4" width="15" height="16" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                <path d="M16 9l5-3v12l-5-3V9z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                <path d="M6 10l3 2-3 2v-4z" fill="rgba(255,255,255,0.3)"/>
              </svg>
            </div>
            <div className="meet-idle-text">Ready to start consultation</div>
            {patient && (
              <div className="meet-idle-patient">
                with <strong>{patient.name}</strong>
              </div>
            )}
            {googleReady && meetUrl && (
              <div className="meet-idle-url">
                <i className="fa-solid fa-link" style={{ marginRight: 6 }} />
                {meetUrl}
              </div>
            )}
          </div>
        )}

        {/* ─── STATE: Consultation Ended ─── */}
        {status === CONSULTATION_STATUS.ENDED && (
          <div className="meet-video-idle">
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(15,157,88,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-check" style={{ fontSize: '1.5rem', color: '#0f9d58' }} />
            </div>
            <div className="meet-idle-text">Consultation ended</div>
            {patient && (
              <div className="meet-idle-patient">
                with <strong>{patient.name}</strong> · Duration: {formatTime(elapsedTime)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════ CONTROLS BAR ══════════ */}
      <div className="meet-controls">
        <div className="meet-controls-left">
          {/* Show Meet URL as copyable link when configured */}
          {meetUrl && googleReady && !isLive && status === CONSULTATION_STATUS.SCHEDULED && (
            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(meetUrl); }} title="Copy meeting link">
              <i className="fa-solid fa-copy" /> Copy Link
            </button>
          )}
        </div>

        <div className="meet-controls-center">
          {/* ─── Not started: Show Join / Start buttons ─── */}
          {!isLive && status === CONSULTATION_STATUS.SCHEDULED && (
            <>
              {googleReady && meetUrl ? (
                <button className="meet-control-btn meet-control-start" onClick={handleJoinMeet}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                    <rect x="1" y="4" width="15" height="16" rx="3" fill="#fff"/>
                    <path d="M16 9l5-3v12l-5-3V9z" fill="#fff"/>
                  </svg>
                  <span>Join Google Meet</span>
                </button>
              ) : (
                <button className="meet-control-btn meet-control-start" onClick={handleStartDemo}>
                  <i className="fa-solid fa-play" />
                  <span>Start Demo Consultation</span>
                </button>
              )}
            </>
          )}

          {/* ─── Live: End Consultation button ─── */}
          {isLive && (
            <button className="meet-control-btn meet-control-end" onClick={handleEnd}>
              <i className="fa-solid fa-phone-slash" />
              <span>End Consultation</span>
            </button>
          )}
        </div>

        <div className="meet-controls-right">
          {isLive && meetWindowOpen && !isDemoSource && (
            <button className="btn btn-ghost btn-sm" onClick={handleFocusMeet} style={{ color: 'var(--primary)', fontSize: '.78rem' }}>
              <i className="fa-solid fa-up-right-from-square" /> Focus Meet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
