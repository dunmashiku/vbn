import type { ChatContext } from "@vbn/shared";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Live help session between a veteran tab and a service officer tab.
 *
 * Demo transport: browser-native WebRTC (audio, video and screen are always
 * encrypted with DTLS-SRTP) with signaling over a BroadcastChannel, so two tabs
 * of the same browser on one laptop can connect with no server at all.
 *
 * Production swaps only the transport: Amazon Chime SDK (HIPAA eligible, under
 * the AWS BAA) or another vendor that signs a BAA. See docs/architecture.md.
 *
 * Roles are fixed: the veteran makes the offer and owns the "plan" data channel;
 * the service officer answers and only receives the plan.
 */
export type Role = "veteran" | "rep";
export type SessionStatus = "starting" | "waiting" | "connecting" | "connected" | "ended";

type Signal =
  | { from: Role; type: "join" | "here" | "leave" }
  | { from: Role; type: "offer" | "answer"; epoch: string; sdp: RTCSessionDescriptionInit }
  | { from: Role; type: "ice"; epoch: string; candidate: RTCIceCandidateInit };

type PlanMessage = { type: "plan"; plan: ChatContext | null };

export interface LiveSession {
  status: SessionStatus;
  localStream: MediaStream | null;
  /** What we're sending as video: the camera or the shared screen. */
  outgoingVideo: MediaStream | null;
  remoteStream: MediaStream | null;
  mediaError: string | null;
  camOn: boolean;
  micOn: boolean;
  sharingScreen: boolean;
  /** undefined: nothing received yet; null: the veteran hid their plan. */
  remotePlan: ChatContext | null | undefined;
  toggleCam: () => void;
  toggleMic: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  end: () => void;
}

const randomId = () => Math.random().toString(36).slice(2, 10);

export function useLiveSession(role: Role, code: string, plan: ChatContext | null): LiveSession {
  const [status, setStatus] = useState<SessionStatus>("starting");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [outgoingVideo, setOutgoingVideo] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [remotePlan, setRemotePlan] = useState<ChatContext | null | undefined>(undefined);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const chanRef = useRef<BroadcastChannel | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const planRef = useRef<ChatContext | null>(plan);
  const endedRef = useRef(false);
  planRef.current = plan;

  const post = (s: Signal) => chanRef.current?.postMessage(s);

  const sendPlan = useCallback(() => {
    const dc = dcRef.current;
    if (role === "veteran" && dc?.readyState === "open") {
      dc.send(JSON.stringify({ type: "plan", plan: planRef.current } satisfies PlanMessage));
    }
  }, [role]);

  // Re-send whenever the plan (or its visibility) changes.
  const planKey = JSON.stringify(plan);
  useEffect(() => {
    sendPlan();
  }, [planKey, sendPlan]);

  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;
    let epoch = "";
    let pendingIce: RTCIceCandidateInit[] = [];
    const chan = new BroadcastChannel(`bn-live-${code}`);
    chanRef.current = chan;

    const currentVideoTrack = () => screenTrackRef.current ?? localRef.current?.getVideoTracks()[0] ?? null;
    const audioTrack = () => localRef.current?.getAudioTracks()[0] ?? null;

    function closePc() {
      dcRef.current?.close();
      dcRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      pendingIce = [];
      setRemoteStream(null);
    }

    function newPc(ep: string): RTCPeerConnection {
      closePc();
      epoch = ep;
      // No STUN/TURN needed: both tabs are on the same machine.
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      if (import.meta.env.DEV) (window as unknown as { __bnPeer?: RTCPeerConnection }).__bnPeer = pc;
      const remote = new MediaStream();
      pc.onicecandidate = (e) => {
        if (e.candidate) post({ from: role, type: "ice", epoch: ep, candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        remote.addTrack(e.track);
        setRemoteStream(new MediaStream(remote.getTracks()));
      };
      pc.onconnectionstatechange = () => {
        if (pcRef.current !== pc || endedRef.current) return;
        const s = pc.connectionState;
        if (s === "connected") setStatus("connected");
        else if (s === "connecting" || s === "new") setStatus("connecting");
        else if (s === "failed" || s === "disconnected" || s === "closed") setStatus("waiting");
      };
      if (role === "veteran") {
        const v = pc.addTransceiver("video", { direction: "sendrecv" });
        const a = pc.addTransceiver("audio", { direction: "sendrecv" });
        void v.sender.replaceTrack(currentVideoTrack());
        void a.sender.replaceTrack(audioTrack());
        const dc = pc.createDataChannel("plan");
        dc.onopen = () => sendPlan();
        dcRef.current = dc;
      } else {
        pc.ondatachannel = (e) => {
          dcRef.current = e.channel;
          e.channel.onmessage = (m) => {
            try {
              const msg = JSON.parse(String(m.data)) as PlanMessage;
              if (msg.type === "plan") setRemotePlan(msg.plan);
            } catch {
              /* ignore malformed */
            }
          };
        };
      }
      setStatus("connecting");
      return pc;
    }

    async function flushIce(pc: RTCPeerConnection) {
      for (const c of pendingIce) await pc.addIceCandidate(c).catch((err) => import.meta.env.DEV && console.warn("ice", err));
      pendingIce = [];
    }

    async function makeOffer() {
      const pc = newPc(randomId());
      const ep = epoch;
      const offer = await pc.createOffer();
      if (pcRef.current !== pc) return;
      await pc.setLocalDescription(offer);
      post({ from: role, type: "offer", epoch: ep, sdp: offer });
    }

    chan.onmessage = async (ev: MessageEvent<Signal>) => {
      const msg = ev.data;
      if (!msg || msg.from === role || endedRef.current) return;
      try {
        if (msg.type === "leave") {
          closePc();
          setRemotePlan(undefined);
          setStatus("waiting");
        } else if (role === "veteran" && (msg.type === "join" || msg.type === "here")) {
          await makeOffer();
        } else if (role === "rep" && msg.type === "join") {
          closePc();
          post({ from: role, type: "here" });
        } else if (role === "rep" && msg.type === "offer") {
          const pc = msg.epoch === epoch && pcRef.current ? pcRef.current : newPc(msg.epoch);
          await pc.setRemoteDescription(msg.sdp);
          for (const t of pc.getTransceivers()) {
            const kind = t.receiver.track.kind;
            await t.sender.replaceTrack(kind === "video" ? currentVideoTrack() : audioTrack());
            t.direction = "sendrecv";
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          post({ from: role, type: "answer", epoch: msg.epoch, sdp: answer });
          await flushIce(pc);
        } else if (role === "veteran" && msg.type === "answer") {
          const pc = pcRef.current;
          if (pc && msg.epoch === epoch && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(msg.sdp);
            await flushIce(pc);
          }
        } else if (msg.type === "ice" && msg.epoch === epoch) {
          const pc = pcRef.current;
          if (pc?.remoteDescription) await pc.addIceCandidate(msg.candidate).catch((err) => import.meta.env.DEV && console.warn("ice", err));
          else pendingIce.push(msg.candidate);
        }
      } catch {
        // A stale or out-of-order signal: the next join/offer recovers.
      }
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        // Mic starts off: two tabs on one laptop would otherwise echo.
        stream.getAudioTracks().forEach((t) => (t.enabled = false));
        localRef.current = stream;
        setLocalStream(stream);
        setOutgoingVideo(stream);
      } catch {
        if (cancelled) return;
        setMediaError("Camera or microphone isn't available. You can still share your screen and your plan.");
      }
      if (cancelled) return;
      setStatus("waiting");
      post({ from: role, type: "join" });
    })();

    const onUnload = () => post({ from: role, type: "leave" });
    window.addEventListener("pagehide", onUnload);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onUnload);
      post({ from: role, type: "leave" });
      closePc();
      chan.close();
      chanRef.current = null;
      localRef.current?.getTracks().forEach((t) => t.stop());
      localRef.current = null;
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
    };
  }, [role, code, sendPlan]);

  const videoSender = () => pcRef.current?.getTransceivers().find((t) => t.receiver.track.kind === "video")?.sender ?? null;

  const stopScreenShare = useCallback(() => {
    const track = screenTrackRef.current;
    if (!track) return;
    screenTrackRef.current = null;
    track.stop();
    void videoSender()?.replaceTrack(localRef.current?.getVideoTracks()[0] ?? null);
    setOutgoingVideo(localRef.current);
    setSharingScreen(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      // Hint the browser toward sharing a tab rather than the whole screen.
      const options = { video: { displaySurface: "browser" }, audio: false, preferCurrentTab: false, selfBrowserSurface: "exclude" } as DisplayMediaStreamOptions;
      const screen = await navigator.mediaDevices.getDisplayMedia(options);
      const track = screen.getVideoTracks()[0];
      if (!track) return;
      screenTrackRef.current = track;
      track.onended = () => stopScreenShare();
      await videoSender()?.replaceTrack(track);
      setOutgoingVideo(screen);
      setSharingScreen(true);
    } catch {
      // The person cancelled the picker.
    }
  }, [stopScreenShare]);

  const toggleCam = useCallback(() => {
    const t = localRef.current?.getVideoTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setCamOn(t.enabled);
  }, []);

  const toggleMic = useCallback(() => {
    const t = localRef.current?.getAudioTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setMicOn(t.enabled);
  }, []);

  const end = useCallback(() => {
    endedRef.current = true;
    post({ from: role, type: "leave" });
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    screenTrackRef.current?.stop();
    setRemoteStream(null);
    setStatus("ended");
  }, [role]);

  return {
    status, localStream, outgoingVideo, remoteStream, mediaError, camOn, micOn, sharingScreen, remotePlan,
    toggleCam, toggleMic, startScreenShare, stopScreenShare, end,
  };
}
