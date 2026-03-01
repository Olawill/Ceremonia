"use client";

import { MusicIcon, PauseIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/lib/ThemeContext";

interface AudioPlayerProps {
  autoPlay: boolean;
  src?: string;
}

export function AudioPlayer({
  autoPlay,
  src = "/audio/royal.mp3",
}: AudioPlayerProps) {
  const { theme } = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onCanPlay = () => setReady(true);
    audio.addEventListener("canplaythrough", onCanPlay);
    return () => audio.removeEventListener("canplaythrough", onCanPlay);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, [autoPlay]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        // Autoplay blocked
      }
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-200">
      {/* Hidden audio element – swap src for a real orchestral mp3 */}
      <audio ref={audioRef} loop preload="none">
        <source src={src} type="audio/mpeg" />
      </audio>

      <button
        onClick={toggle}
        title={playing ? "Pause music" : "Play music"}
        className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md
                  border transition-all duration-300 cursor-pointer text-lg"
        style={{
          background: `${theme.bg}CC`,
          borderColor: `${theme.gold}60`,
          color: theme.gold,
          boxShadow: playing ? `0 0 20px ${theme.gold}40` : "none",
        }}
      >
        {playing ? (
          <PauseIcon className="size-4" />
        ) : (
          <MusicIcon className="size-4" />
        )}
      </button>

      {/* Animated bars when playing */}
      {playing && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-0.5 rounded-full"
              style={{
                background: theme.gold,
                height: "100%",
                animation: `equalizer${n} ${0.4 + n * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
          <style>{`
            @keyframes equalizer1{from{height:20%}to{height:90%}}
            @keyframes equalizer2{from{height:60%}to{height:30%}}
            @keyframes equalizer3{from{height:40%}to{height:100%}}
            @keyframes equalizer4{from{height:80%}to{height:20%}}
          `}</style>
        </div>
      )}
    </div>
  );
}
