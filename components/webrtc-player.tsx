"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, VideoOff } from "lucide-react";

type WebRtcPlayerProps = {
  whepUrl: string;
  fallbackSrc?: string;
  stunServer?: string;
  muted?: boolean;
  className?: string;
  onFail?: () => void;
};

const DEFAULT_STUN = "stun:stun.l.google.com:19302";
const RETRY_MS = 1500;
const MAX_ATTEMPTS = 2;
const CONNECT_TIMEOUT_MS = 5000;

export function WebRtcPlayer({
  whepUrl,
  fallbackSrc,
  stunServer = DEFAULT_STUN,
  muted = true,
  className,
  onFail,
}: WebRtcPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onFailRef = useRef(onFail);
  const connectedRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [connected, setConnected] = useState(false);

  const supported =
    typeof window !== "undefined" && !!window.RTCPeerConnection;
  const failed = !supported || !whepUrl || attempt >= MAX_ATTEMPTS;
  const status = failed ? "failed" : connected ? "connected" : "connecting";

  useEffect(() => {
    onFailRef.current = onFail;
  });

  useEffect(() => {
    if (!supported || !whepUrl || attempt >= MAX_ATTEMPTS) {
      onFailRef.current?.();
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: stunServer }],
    });
    pc.addTransceiver("video", { direction: "recvonly" });

    connectedRef.current = false;

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let connectTimer: ReturnType<typeof setTimeout> | null = null;
    let resourceUrl: string | null = null;

    const retryOrFail = () => {
      if (disposed) return;
      if (attempt + 1 >= MAX_ATTEMPTS) {
        onFailRef.current?.();
        return;
      }
      retryTimer = setTimeout(() => {
        if (!disposed) setAttempt((a) => a + 1);
      }, RETRY_MS);
    };

    connectTimer = setTimeout(() => {
      if (!disposed && !connectedRef.current) {
        setConnected(false);
        retryOrFail();
      }
    }, CONNECT_TIMEOUT_MS);

    pc.ontrack = (ev) => {
      connectedRef.current = true;
      if (connectTimer) clearTimeout(connectTimer);
      if (videoRef.current && ev.streams?.[0]) {
        videoRef.current.srcObject = ev.streams[0];
        videoRef.current.play().catch(() => {});
        setConnected(true);
      }
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate || !resourceUrl) return;
      fetch(resourceUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/trickle-ice" },
        body: JSON.stringify(ev.candidate.toJSON()),
      }).catch(() => {
        /* trickle ICE opsional */
      });
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        connectedRef.current = false;
        setConnected(false);
        retryOrFail();
      }
    };

    const connect = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const res = await fetch(whepUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
            Accept: "application/sdp",
          },
          body: pc.localDescription?.sdp,
        });
        if (!res.ok) {
          console.error("WHEP gagal:", res.status, await res.text());
          retryOrFail();
          return;
        }
        resourceUrl = res.headers.get("Location") ?? null;
        const answer = await res.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answer });
      } catch (err) {
        console.error("Gagal setup WHEP:", err);
        retryOrFail();
      }
    };

    connect();

    function cleanup() {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (connectTimer) clearTimeout(connectTimer);
      pc.close();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whepUrl, stunServer, attempt]);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-zinc-900">
      {fallbackSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallbackSrc}
          alt="Live CCTV"
          loading="lazy"
          className={`h-full w-full object-cover ${className ?? ""} ${
            status === "connected" ? "hidden" : ""
          }`}
        />
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${className ?? ""} ${
          status === "connected" ? "" : "hidden"
        }`}
      />
      {!fallbackSrc && status === "connecting" && (
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-xs">Menghubungkan...</span>
        </div>
      )}
      {!fallbackSrc && status === "failed" && (
        <VideoOff className="size-10 text-zinc-600" />
      )}
    </div>
  );
}