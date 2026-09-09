// MediTrust AI — Google Meet Consultation Studio
// The dominant visual component for the consultation page.
// Shows Google Meet integration, live transcript, and consultation controls.

import { useState, useEffect, useRef } from 'react';
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
  const [isLive, setIsLive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const timerRef = useRef(null);
  const stopSimRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const videoRef = useRef(null);

  const googleConfig = getConfigurationStatus();
  const meetUrl = consultation?.meetingUrl || '';
  const meetCode = consultation?.meetingCode || '';
  const isDemo = consultation?.source === 'demo' || !isGoogleConfigured();

  // Elapsed timer
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptLines]);

  // Try to get webcam preview
  useEffect(() => {
    if (isLive && camOn && videoRef.current) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => { /* camera access denied or unavailable */ });
    }
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [isLive, camOn]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = () => {
    setIsLive(true);
    setElapsedTime(0);
    onStartConsultation?.();

    // Start simulated live transcription in demo mode
    if (isDemo) {
      const stop = simulateLiveTranscription((line, index) => {
        if (line === null) {
          // Transcription complete
          setIsLive(false);
          onTranscriptReady?.();
        } else {
          onTranscriptLineAdd?.(line);
        }
      });
      stopSimRef.current = stop;
    }
  };

  const handleEnd = () => {
    setIsLive(false);
    if (stopSimRef.current) {
      stopSimRef.current();
      stopSimRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    onEndConsultation?.();
  };

  const handleOpenMeet = () => {
    if (meetUrl) {
      window.open(meetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const status = consultation?.status || CONSULTATION_STATUS.SCHEDULED;

  return (
    <div className="meet-studio">
      {/* ── Configuration Banner ── */}
      {isDemo && !isLive && status === CONSULTATION_STATUS.SCHEDULED && (
        <div className="meet-config-banner">
          <div className="meet-config-banner-content">
            <i className="fa-solid fa-info-circle" />
            <span>Demo Mode — Google Meet credentials not configured. All features remain fully functional with simulation.</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowConfig(!showConfig)} style={{ marginLeft: 'auto', color: 'inherit' }}>
              <i className={`fa-solid fa-chevron-${showConfig ? 'up' : 'down'}`} /> {showConfig ? 'Hide' : 'Setup'}
            </button>
          </div>
          {showConfig && (
            <div className="meet-config-details">
              <div style={{ fontSize: '.82rem', lineHeight: 1.7 }}>
                <strong>To enable real Google Meet:</strong>
                <ol style={{ margin: '8px 0 0 20px' }}>
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
                  <li>Enable the Google Meet API and Google Calendar API</li>
                  <li>Create OAuth 2.0 credentials (Web application)</li>
                  <li>Add these to <code>.env.local</code>:
                    <pre style={{ background: 'rgba(0,0,0,0.04)', padding: '8px 12px', borderRadius: 6, margin: '6px 0', fontSize: '.78rem' }}>
{`VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_API_KEY=your-api-key`}
                    </pre>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Meeting Header ── */}
      <div className="meet-header">
        <div className="meet-header-left">
          <div className="meet-google-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="16" height="16" rx="3" fill="#1a73e8"/>
              <path d="M8 10l2.5 2L13 10l3 2.5V15H8V10z" fill="#fff"/>
              <circle cx="16" cy="8" r="3" fill="#0f9d58"/>
            </svg>
            <span>Google Meet</span>
          </div>
          {meetCode && (
            <span className="meet-code">{meetCode}</span>
          )}
          {isDemo && <span className="badge badge-amber" style={{ fontSize: '.65rem' }}>Demo</span>}
        </div>
        <div className="meet-header-right">
          {isLive && (
            <div className="meet-timer">
              <div className="recording-dot" />
              {formatTime(elapsedTime)}
            </div>
          )}
          {status === CONSULTATION_STATUS.ACTIVE && (
            <span className="badge badge-red"><i className="fa-solid fa-circle" style={{ fontSize: '.5rem' }} /> Live</span>
          )}
        </div>
      </div>

      {/* ── Video Stage (Dominant Area) ── */}
      <div className="meet-video-stage">
        {isLive ? (
          <div className="meet-video-active">
            {/* Doctor webcam preview */}
            <div className="meet-video-self">
              {camOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="meet-video-element" />
              ) : (
                <div className="meet-video-avatar">
                  <i className="fa-solid fa-user-doctor" />
                </div>
              )}
              <div className="meet-video-label">You (Doctor)</div>
            </div>

            {/* Patient view (simulated) */}
            <div className="meet-video-remote">
              <div className="meet-video-avatar meet-video-avatar-patient">
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                  {patient?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                </div>
              </div>
              <div className="meet-video-label">{patient?.name || 'Patient'}</div>
            </div>

            {/* Audio Waveform */}
            <div className="meet-waveform">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="meet-waveform-bar" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>

            {/* Transcript count overlay */}
            <div className="meet-transcript-count">
              <i className="fa-solid fa-closed-captioning" />
              {transcriptLines.length} lines transcribed
            </div>
          </div>
        ) : (
          <div className="meet-video-idle">
            <div className="meet-idle-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                <path d="M10 9l5 3-5 3V9z" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <div className="meet-idle-text">
              {status === CONSULTATION_STATUS.SCHEDULED
                ? 'Ready to start consultation'
                : status === CONSULTATION_STATUS.ENDED
                ? 'Consultation ended'
                : 'Google Meet Consultation'}
            </div>
            {patient && (
              <div className="meet-idle-patient">
                with <strong>{patient.name}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Call Controls ── */}
      <div className="meet-controls">
        <div className="meet-controls-left">
          {meetUrl && !isLive && (
            <button className="btn btn-outline btn-sm" onClick={handleOpenMeet} title="Open in Google Meet">
              <i className="fa-solid fa-external-link" /> Open Meet
            </button>
          )}
        </div>

        <div className="meet-controls-center">
          <button
            className={`meet-control-btn ${micOn ? '' : 'meet-control-off'}`}
            onClick={() => setMicOn(!micOn)}
            title={micOn ? 'Mute' : 'Unmute'}
            disabled={!isLive}
          >
            <i className={`fa-solid ${micOn ? 'fa-microphone' : 'fa-microphone-slash'}`} />
          </button>

          <button
            className={`meet-control-btn ${camOn ? '' : 'meet-control-off'}`}
            onClick={() => setCamOn(!camOn)}
            title={camOn ? 'Camera off' : 'Camera on'}
            disabled={!isLive}
          >
            <i className={`fa-solid ${camOn ? 'fa-video' : 'fa-video-slash'}`} />
          </button>

          {!isLive ? (
            <button className="meet-control-btn meet-control-start" onClick={handleStart}>
              <i className="fa-solid fa-phone" />
              <span>Start Consultation</span>
            </button>
          ) : (
            <button className="meet-control-btn meet-control-end" onClick={handleEnd}>
              <i className="fa-solid fa-phone-slash" />
              <span>End</span>
            </button>
          )}

          <button
            className="meet-control-btn"
            title="Screen share"
            disabled={!isLive}
          >
            <i className="fa-solid fa-display" />
          </button>

          <button
            className="meet-control-btn"
            title="More options"
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
        </div>

        <div className="meet-controls-right">
          {isLive && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', fontSize: '.78rem' }}>
              <i className="fa-solid fa-closed-captioning" /> Captions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
