"use client";

import { useEffect, useRef, useState } from "react";
import { IconCamera } from "./icons";

const CARD_RATIO = 2.5 / 3.5;

export function CameraCapture({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setReady(true);
      })
      .catch(() => setError("Couldn't access the camera. Check permissions and try again."));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    let sx: number, sy: number, sw: number, sh: number;
    if (vw / vh > CARD_RATIO) {
      sh = vh;
      sw = vh * CARD_RATIO;
      sx = (vw - sw) / 2;
      sy = 0;
    } else {
      sw = vw;
      sh = vw / CARD_RATIO;
      sx = 0;
      sy = (vh - sh) / 2;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 750;
    canvas.height = 750 / CARD_RATIO;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => blob && onCapture(blob), "image/jpeg", 0.92);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
      {error ? (
        <div className="form-error">{error}</div>
      ) : (
        <>
          <div className="viewfinder" style={{ aspectRatio: `${CARD_RATIO}` }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} autoPlay muted playsInline />
            <span className="viewfinder-corner tl" />
            <span className="viewfinder-corner tr" />
            <span className="viewfinder-corner bl" />
            <span className="viewfinder-corner br" />
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>Hold the card flat inside the frame</p>
          <button type="button" className="btn btn-highlight btn-lg" onClick={capture} disabled={!ready}>
            <IconCamera size={18} />
            Capture
          </button>
        </>
      )}
    </div>
  );
}
