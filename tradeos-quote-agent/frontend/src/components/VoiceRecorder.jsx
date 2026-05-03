import { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ clientName, onRecorded, onTyped, onBack }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [permError, setPermError] = useState(null);
  const [typedText, setTypedText] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false); // Stable ref for use inside closures

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    if (isRecordingRef.current) return;
    setPermError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Pick the best supported format — webm/opus on Android/Chrome, mp4 on iOS Safari
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        onRecorded(blob);
      };

      recorder.start(100); // Emit a chunk every 100ms for smooth data collection
      isRecordingRef.current = true;
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setPermError(
        'Microphone access denied. Tap Allow when the browser asks, then try again.'
      );
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current?.stop(); // Triggers onstop → calls onRecorded
    setIsRecording(false);
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="recorder-screen">
      <h1>{isRecording ? 'Recording…' : 'Describe the Job'}</h1>
      <p className="recorder-hint" style={{ marginTop: '8px' }}>
        {isRecording
          ? "Keep talking. Release when you're done."
          : "Hold the button and speak — materials, size, location, anything relevant."}
      </p>

      {permError && (
        <div className="error-box" style={{ marginTop: '20px', textAlign: 'left' }}>
          {permError}
        </div>
      )}

      {isRecording && (
        <>
          <div className="timer" style={{ marginTop: '28px' }}>
            {formatTime(seconds)}
          </div>
          <div className="timer-label">recording in progress</div>
        </>
      )}

      <div className="mic-wrap">
        {isRecording && <div className="mic-ring mic-ring--1" />}
        {isRecording && <div className="mic-ring mic-ring--2" />}
        <button
          className={`mic-button${isRecording ? ' recording' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
          onPointerUp={(e) => { e.preventDefault(); stopRecording(); }}
          onPointerCancel={(e) => { e.preventDefault(); stopRecording(); }}
        >
          <span className="mic-icon" role="img" aria-label="Microphone">🎙</span>
          <span>{isRecording ? 'Release to Send' : 'Hold to Record'}</span>
        </button>
      </div>

      {!isRecording && (
        <>
          <div className="or-divider">or</div>

          <textarea
            className="text-fallback"
            rows={4}
            placeholder="Type the job description here — materials, size, location, anything relevant."
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
          />
          <p className="textarea-hint">Be specific — mention size, materials, location</p>

          <button
            className="btn btn-primary"
            style={{ marginTop: '12px' }}
            disabled={typedText.trim().length === 0}
            onClick={() => onTyped(typedText.trim())}
          >
            Generate Quote
          </button>

          <p className="client-target" style={{ marginTop: '20px' }}>
            Quote will be sent to <strong>{clientName}</strong>
          </p>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        </>
      )}
    </div>
  );
}
