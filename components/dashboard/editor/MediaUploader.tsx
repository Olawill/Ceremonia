"use client";

import clsx from "clsx";
import {
  LinkIcon,
  Loader2Icon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PlanGate } from "@/components/ui/PlanGate";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

import { StockPhoto } from "@/server/routers/stock";

import type { EventConfig } from "@/types/event";
import {
  AudioCategory,
  getFallbackPhotos,
  PhotoCategory,
  STOCK_AUDIO,
  STOCK_AUDIO_CATEGORIES,
  STOCK_PHOTO_CATEGORIES,
} from "@/types/stocks";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "upload" | "url" | "stock";

interface Props {
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
}

interface UploadFieldProps {
  label: string;
  hint: string;
  accept: string;
  type: "photo" | "audio";
  value: string | undefined;
  onUpload: (value: File | string) => void;
  onClear: () => void;
}

// ─── UploadField ──────────────────────────────────────────────────────────────

function UploadField({
  label,
  hint,
  accept,
  type,
  value,
  onUpload,
  onClear,
}: UploadFieldProps) {
  const { api } = useApi();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("upload");
  const [urlInput, setUrlInput] = useState("");
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);

  const [photoCategory, setPhotoCategory] = useState<PhotoCategory>("All");
  const [audioCategory, setAudioCategory] = useState<AudioCategory>("All");

  const [stockQuery, setStockQuery] = useState("wedding");
  const [stockResults, setStockResults] = useState<StockPhoto[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSearched, setStockSearched] = useState(false);

  const [stockHasMore, setStockHasMore] = useState(false);
  const [audioResults, setAudioResults] = useState<typeof STOCK_AUDIO>([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioHasMore, setAudioHasMore] = useState(false);
  const [audioPage, setAudioPage] = useState(1);
  const [audioFromFallback, setAudioFromFallback] = useState(false);

  const [stockIsFromFallback, setStockIsFromFallback] = useState(false);

  useEffect(() => {
    if (
      tab === "stock" &&
      type === "photo" &&
      stockResults.length === 0 &&
      !stockSearched
    ) {
      setStockResults(getFallbackPhotos(photoCategory));
      setStockIsFromFallback(true);
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "stock" || type !== "photo") return;
    if (stockIsFromFallback) {
      setStockResults(getFallbackPhotos(photoCategory));
    } else if (stockSearched) {
      searchStock(stockQuery, 1);
    }
  }, [photoCategory]);

  useEffect(() => {
    if (tab === "stock" && type === "audio" && audioResults.length === 0) {
      searchAudio(audioCategory);
    }
  }, [tab]);

  // ── file upload ────────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    onUpload(file); // flows up to updateConfig which handles blob URL + queuing
  };

  // ── url fetch → blob ───────────────────────────────────────────────────────
  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (!url) return;
    onUpload(url);
    setUrlInput("");
  };

  // ── stock pick → blob ──────────────────────────────────────────────────────
  const handleStockPick = (fullUrl: string) => {
    onUpload(fullUrl);
  };

  const searchStock = async (q: string, page = 1) => {
    setStockLoading(true);
    setStockSearched(true);
    try {
      const { data, error } = await api.stock.photos.get({
        query: {
          q,
          page: String(page),
          category: photoCategory === "All" ? undefined : photoCategory,
        },
      });
      if (error) {
        if (page === 1) {
          setStockResults(getFallbackPhotos());
          setStockIsFromFallback(true);
          setStockHasMore(false);
        }
        return;
      }
      const incoming: StockPhoto[] = data.photos ?? [];
      if (incoming.length === 0 && page === 1) {
        setStockResults(getFallbackPhotos());
        setStockIsFromFallback(true);
      } else if (page === 1) {
        setStockResults(incoming);
        setStockIsFromFallback(false);
      } else {
        setStockResults((prev) => [...prev, ...incoming]);
        setStockIsFromFallback(false);
        setStockHasMore(false);
      }
      setStockPage(page);
      setStockHasMore(data.hasMore ?? false);
    } catch {
      toast.error("Could not reach stock photo service");
      if (page === 1) {
        setStockResults(getFallbackPhotos());
        setStockIsFromFallback(true);
        setStockHasMore(false);
      }
    } finally {
      setStockLoading(false);
    }
  };

  const searchAudio = async (category: AudioCategory, page = 1) => {
    setAudioLoading(true);
    try {
      const { data, error } = await api.stock.audio.get({
        query: {
          q: "wedding romantic",
          category: category === "All" ? undefined : category,
          page: String(page),
        },
      });
      if (error || !data?.audio?.length) {
        // Fallback to static list
        setAudioResults(
          STOCK_AUDIO.filter(
            (a) => category === "All" || a.category === category,
          ),
        );
        setAudioFromFallback(true);
        setAudioHasMore(false);
        return;
      }
      const incoming = data.audio;
      if (page === 1) {
        setAudioResults(incoming as any);
      } else {
        setAudioResults((prev) => [...prev, ...(incoming as any)]);
      }
      setAudioFromFallback(false);
      setAudioHasMore(data.hasMore ?? false);
      setAudioPage(page);
    } catch {
      setAudioResults(
        STOCK_AUDIO.filter(
          (a) => category === "All" || a.category === category,
        ),
      );
      setAudioFromFallback(true);
      setAudioHasMore(false);
    } finally {
      setAudioLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "Upload", icon: <UploadIcon className="size-3" /> },
    { id: "url", label: "URL", icon: <LinkIcon className="size-3" /> },
    { id: "stock", label: "Stock", icon: <SearchIcon className="size-3" /> },
  ];

  return (
    <div className="space-y-3!">
      {/* Header */}
      <div>
        <p className="font-label text-[11px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">
          {label}
        </p>
        <p className="font-display italic text-sm text-[#F5F0E870] mt-0.5!">
          {hint}
        </p>
      </div>

      {/* Current value preview */}
      {value && (
        <div className="flex items-center gap-3 rounded-lg border border-[#D4AF3730] bg-[#D4AF3708] px-4! py-3!">
          {type === "photo" ? (
            <img
              src={value}
              alt=""
              className="h-14 w-20 rounded object-cover shrink-0"
            />
          ) : (
            <audio controls src={value} className="flex-1 h-8 min-w-0" />
          )}
          <button
            onClick={onClear}
            className="ml-auto text-[#D4AF3750] hover:text-dash-error transition-colors shrink-0"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      )}

      {/* Tab strip */}
      <div className="rounded-xl border border-[#D4AF3760] overflow-hidden">
        <div className="flex border-b border-[#D4AF3740]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5! font-label font-semibold text-[9px] tracking-[0.3em] uppercase transition-all cursor-pointer",
                tab === t.id
                  ? "bg-[#D4AF3712] text-[#D4AF37]"
                  : "text-[#F5F0E890] hover:text-[#F5F0E8]",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-3!">
          {/* ── Upload tab ── */}
          {tab === "upload" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#D4AF3730] bg-[#D4AF3705] py-7! cursor-pointer hover:border-[#D4AF3760] hover:bg-[#D4AF370A] transition-colors"
            >
              <UploadIcon className="size-5 text-[#D4AF3760]" />
              <span className="font-label text-[9px] tracking-[0.3em] uppercase text-[#D4AF3760]">
                Click or drag to upload
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {/* ── URL tab ── */}
          {tab === "url" && (
            <div className="space-y-2!">
              <div className="relative">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  placeholder={
                    type === "photo"
                      ? "https://example.com/photo.jpg"
                      : "https://example.com/music.mp3"
                  }
                  className={clsx(
                    "dash-input w-full text-sm",
                    urlInput && "pr-7!",
                  )}
                />

                {urlInput && (
                  <button
                    onClick={() => {
                      setUrlInput("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#D4AF3750] hover:text-[#D4AF37] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    <XIcon className="size-3" />
                  </button>
                )}
              </div>
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="w-full py-2.5! rounded-lg font-label text-[9px] tracking-[0.3em] uppercase transition-all dash-btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Use this URL
              </button>
              <p className="font-display italic text-[11px] text-[#F5F0E840] text-center">
                The file will be saved to your media library
              </p>
            </div>
          )}

          {/* ── Stock tab ── */}
          {tab === "stock" && (
            <div>
              {type === "photo" && (
                <div className="space-y-2!">
                  <>
                    <div className="flex gap-1.5!">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={stockQuery}
                          onChange={(e) => setStockQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              stockQuery.trim() &&
                              !stockLoading
                            )
                              searchStock(stockQuery, 1);
                          }}
                          placeholder="Search event photos…"
                          className="dash-input w-full text-xs py-1.5! disabled:opacity-50 pr-6!"
                        />
                        {stockQuery && !stockLoading && (
                          <button
                            onClick={() => setStockQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#D4AF3750] hover:text-[#D4AF37] transition-colors cursor-pointer"
                            tabIndex={-1}
                          >
                            <XIcon className="size-3" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const q = stockQuery.trim();
                          searchStock(q, 1);
                          setStockQuery("");
                        }}
                        disabled={!stockQuery.trim() || stockLoading}
                        className="px-3! rounded-lg dash-btn-primary font-label text-[8px] tracking-[0.2em] uppercase disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        {stockLoading ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : (
                          <SearchIcon className="size-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Category filter */}
                    <div className="flex gap-1 flex-wrap">
                      {STOCK_PHOTO_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPhotoCategory(cat)}
                          className={clsx(
                            "px-2! py-0.5! rounded font-label text-[7px] tracking-widest uppercase transition-all border cursor-pointer",
                            photoCategory === cat
                              ? "bg-[#D4AF3720] text-[#D4AF37] border-[#D4AF3760]"
                              : "text-[#F5F0E880] hover:text-[#F5F0E8] border-transparent",
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {stockSearched &&
                      !stockLoading &&
                      stockResults.length === 0 && (
                        <p className="text-center font-label text-[8px] tracking-widest uppercase text-[#F5F0E870] py-6!">
                          No results
                        </p>
                      )}

                    <div className="overflow-y-auto max-h-64 space-y-2!">
                      <div className="grid grid-cols-3 gap-1.5">
                        {stockResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleStockPick(p.full)}
                            title={p.label}
                            className="relative group rounded-lg overflow-hidden aspect-4/3 cursor-pointer"
                          >
                            <img
                              src={p.thumb}
                              alt={p.label}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-1.5! opacity-0 group-hover:opacity-100">
                              <span className="font-label text-[8px] tracking-widest uppercase text-white/90 truncate">
                                {p.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {stockResults.length > 0 &&
                        !stockIsFromFallback &&
                        stockHasMore && (
                          <button
                            onClick={() =>
                              searchStock(stockQuery, stockPage + 1)
                            }
                            disabled={stockLoading}
                            className="w-full py-2! rounded-lg font-label text-[9px] tracking-[0.3em] uppercase text-[#D4AF3790] hover:text-[#D4AF37] border border-[#D4AF3740] hover:border-[#D4AF3760] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {stockLoading ? (
                              <>
                                <Loader2Icon className="size-3.5 animate-spin" />{" "}
                                Loading…
                              </>
                            ) : (
                              "Load more"
                            )}
                          </button>
                        )}
                    </div>
                  </>
                </div>
              )}

              {type === "audio" && (
                <div className="space-y-2!">
                  {/* Category filter */}
                  <div className="flex gap-1 flex-wrap">
                    {STOCK_AUDIO_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setAudioCategory(cat);
                          searchAudio(cat, 1);
                        }}
                        className={clsx(
                          "px-2! py-1! rounded-md font-label text-[8px] tracking-widest uppercase transition-all cursor-pointer",
                          audioCategory === cat
                            ? "bg-[#D4AF3720] text-[#D4AF37] border border-[#D4AF3760]"
                            : "text-[#F5F0E880] hover:text-[#F5F0E8] border border-transparent",
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {audioLoading && audioResults.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-4! text-[#D4AF37]">
                      <Loader2Icon className="size-3.5 animate-spin" />
                      <span className="font-label text-[8px] tracking-widest uppercase">
                        Loading…
                      </span>
                    </div>
                  )}

                  <div className="overflow-y-auto max-h-64 space-y-1.5!">
                    {audioResults.map((a) => (
                      <div
                        key={a.full}
                        className={clsx(
                          "flex items-center gap-3 rounded-lg px-3! py-2.5! border transition-all",
                          previewAudio === a.preview
                            ? "border-[#D4AF3760] bg-[#D4AF3710]"
                            : "border-[#D4AF3780] bg-[#D4AF3705] hover:border-[#D4AF37]",
                        )}
                      >
                        <button
                          onClick={() =>
                            setPreviewAudio(
                              previewAudio === a.preview ? null : a.preview,
                            )
                          }
                          className="text-[#D4AF37] shrink-0 text-base leading-none cursor-pointer"
                        >
                          {previewAudio === a.preview ? "⏹" : "▶"}
                        </button>
                        {previewAudio === a.preview && (
                          <audio
                            src={a.preview}
                            autoPlay
                            onEnded={() => setPreviewAudio(null)}
                            className="hidden"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-display text-sm text-[#F5F0E890] block truncate">
                            {a.label}
                          </span>
                          <span className="font-label text-[8px] tracking-widest uppercase text-[#D4AF3790]">
                            {a.category}
                          </span>
                        </div>
                        <button
                          onClick={() => handleStockPick(a.full)}
                          className="font-label text-[8px] tracking-[0.3em] uppercase text-[#D4AF3790] hover:text-[#D4AF37] transition-colors shrink-0 px-2! py-1! rounded border border-[#D4AF3760] hover:border-[#D4AF3780]"
                        >
                          Use
                        </button>
                      </div>
                    ))}

                    {audioHasMore && !audioFromFallback && (
                      <button
                        onClick={() =>
                          searchAudio(audioCategory, audioPage + 1)
                        }
                        disabled={audioLoading}
                        className="w-full py-2! rounded-lg font-label text-[9px] tracking-[0.3em] uppercase text-[#D4AF3790] hover:text-[#D4AF37] border border-[#D4AF3740] hover:border-[#D4AF3760] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {audioLoading ? (
                          <>
                            <Loader2Icon className="size-3.5 animate-spin" />{" "}
                            Loading…
                          </>
                        ) : (
                          "Load more"
                        )}
                      </button>
                    )}
                  </div>

                  {audioFromFallback && (
                    <p className="font-label text-[7px] tracking-widest uppercase text-[#F5F0E820] text-center">
                      Showing curated tracks
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MediaUploader (exported) ─────────────────────────────────────────────────

export function MediaUploader({ config, onChange }: Props) {
  return (
    <div className="space-y-6!">
      <p className="font-label text-[12px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]">
        Media
      </p>

      <UploadField
        label="Hero Photo"
        hint="Shown behind the couple's names. JPG or PNG, max 10MB."
        accept="image/*"
        type="photo"
        value={config.heroPhotoUrl}
        onUpload={(url) => onChange({ heroPhotoUrl: url as string })}
        onClear={() => onChange({ heroPhotoUrl: undefined })}
      />

      <div className="h-px bg-[#D4AF3718]" />

      <PlanGate requires="starter" featureName="Custom audio">
        <UploadField
          label="Background Music"
          hint="Plays when the invitation opens. MP3 or WAV, max 20MB."
          accept="audio/*"
          type="audio"
          value={config.audioUrl}
          onUpload={(url) => onChange({ audioUrl: url as string })}
          onClear={() => onChange({ audioUrl: undefined })}
        />
      </PlanGate>
    </div>
  );
}
