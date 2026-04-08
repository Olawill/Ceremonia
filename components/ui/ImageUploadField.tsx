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

import { StockPhoto } from "@/server/routers/stock";

import {
  getFallbackPhotos,
  PhotoCategory,
  STOCK_PHOTO_CATEGORIES,
} from "@/types/stocks";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

type Tab = "upload" | "url" | "stock";

interface Props {
  value: string | undefined;
  onChange: (url: string | File | undefined) => void;
  hint?: string;
}

export function ImageUploadField({ value, onChange, hint }: Props) {
  const { api } = useApi();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("upload");
  const [urlInput, setUrlInput] = useState("");

  // Stock search state
  const [stockQuery, setStockQuery] = useState("wedding");
  const [stockResults, setStockResults] = useState<StockPhoto[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSearched, setStockSearched] = useState(false);
  const [stockHasMore, setStockHasMore] = useState(false);
  const [photoCategory, setPhotoCategory] = useState<PhotoCategory>("All");

  const [stockIsFromFallback, setStockIsFromFallback] = useState(false);

  useEffect(() => {
    if (tab === "stock" && stockResults.length === 0 && !stockSearched) {
      setStockResults(getFallbackPhotos(photoCategory));
      setStockIsFromFallback(true);
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "stock") return;
    if (stockIsFromFallback) {
      setStockResults(getFallbackPhotos(photoCategory));
    } else if (stockSearched) {
      searchStock(stockQuery, 1);
    }
  }, [photoCategory]);

  const handleFile = (file: File) => {
    onChange(file); // updateConfig intercepts File, creates blob URL, queues it
    setOpen(false);
  };

  const handleUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL including https://");
      return;
    }
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    onChange(url); // updateConfig detects external URL, queues for proxy on save
    setUrlInput("");
    setOpen(false);
  };

  const handleStock = (fullUrl: string) => {
    onChange(fullUrl);
    setOpen(false);
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
        }
        return;
      }
      const incoming: StockPhoto[] = data.photos ?? [];
      if (incoming.length === 0 && page === 1) {
        // Fall back to our curated list so the tab is never empty
        setStockResults(getFallbackPhotos());
        setStockIsFromFallback(true);
      } else if (page === 1) {
        setStockResults(incoming);
        setStockIsFromFallback(false);
      } else {
        setStockResults((prev) => [...prev, ...incoming]);
        setStockIsFromFallback(false);
      }
      setStockPage(page);
      setStockHasMore(data.hasMore ?? false);
    } catch {
      toast.error("Could not load stock photos");
      // Show fallback on network error too
      if (page === 1) {
        setStockResults(getFallbackPhotos());
        setStockIsFromFallback(true);
      }
    } finally {
      setStockLoading(false);
    }
  };

  const tabs = [
    {
      id: "upload" as Tab,
      icon: <UploadIcon className="size-3" />,
      label: "Upload",
    },
    { id: "url" as Tab, icon: <LinkIcon className="size-3" />, label: "URL" },
    {
      id: "stock" as Tab,
      icon: <SearchIcon className="size-3" />,
      label: "Stock",
    },
  ];

  return (
    <div className="space-y-1.5!">
      {/* Current value row */}
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#D4AF3730] bg-[#D4AF3708] px-3! py-2!">
          <img
            src={value}
            alt=""
            className="h-10 w-14 rounded object-cover shrink-0"
          />
          <span className="flex-1 font-display text-xs text-[#F5F0E860] truncate">
            {value.split("/").pop()}
          </span>
          <button
            onClick={() => onChange(undefined)}
            className="text-[#D4AF3770] hover:text-dash-error transition-colors shrink-0"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="dash-input w-full flex items-center gap-2 text-[#D4AF3770] hover:text-[#D4AF37] transition-colors text-left"
        >
          <UploadIcon className="size-3.5 shrink-0" />
          <span className="font-label font-semibold text-[9px] tracking-[0.3em] uppercase">
            {hint ?? "Upload or pick an image"}
          </span>
        </button>
      )}

      {/* Change button when value is set */}
      {value && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="font-label text-[8px] tracking-[0.3em] uppercase text-[#D4AF3780] hover:text-[#D4AF37] transition-colors"
        >
          Change image
        </button>
      )}

      {/* Expandable picker */}
      {open && (
        <div className="rounded-xl border border-[#D4AF3770] overflow-hidden">
          {/* Tab strip */}
          <div className="flex border-b border-[#D4AF3760]">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-2! font-label text-[8px] tracking-[0.25em] uppercase transition-all",
                  tab === t.id
                    ? "bg-[#D4AF3712] text-[#D4AF37]"
                    : "text-[#F5F0E870] hover:text-[#F5F0E890]",
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="p-2.5!">
            {/* Upload tab */}
            {tab === "upload" && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[#D4AF3760] py-5! cursor-pointer hover:border-[#D4AF3780] hover:bg-[#D4AF3705] transition-colors"
              >
                <UploadIcon className="size-4 text-[#D4AF3780]" />
                <span className="font-label text-[8px] tracking-[0.3em] uppercase text-[#D4AF3780]">
                  Click or drag to upload
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}

            {/* URL tab */}
            {tab === "url" && (
              <div className="space-y-2!">
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrl()}
                    placeholder="https://example.com/photo.jpg"
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
                  onClick={handleUrl}
                  disabled={!urlInput.trim()}
                  className="w-full py-2! rounded-lg font-label text-[8px] tracking-[0.3em] uppercase dash-btn-primary disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  Use this URL
                </button>
              </div>
            )}

            {/* Stock tab */}
            {tab === "stock" && (
              <div className="space-y-2!">
                {/* Search bar */}
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
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      <SearchIcon className="size-3" />
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

                {/* States */}
                {!stockSearched && !stockLoading && (
                  <p className="text-center font-label text-[8px] tracking-widest uppercase text-[#F5F0E870] py-4!">
                    Search to browse free photos
                  </p>
                )}
                {stockSearched &&
                  !stockLoading &&
                  stockResults.length === 0 && (
                    <p className="text-center font-label text-[8px] tracking-widest uppercase text-[#F5F0E830] py-4!">
                      No results found
                    </p>
                  )}

                <div className="overflow-y-auto max-h-52 space-y-2!">
                  <div className="grid grid-cols-4 gap-1">
                    {stockResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleStock(p.full)}
                        title={p.label}
                        className="relative group rounded overflow-hidden aspect-square cursor-pointer"
                      >
                        <img
                          src={p.thumb}
                          alt={p.label}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                      </button>
                    ))}
                  </div>

                  {stockResults.length > 0 &&
                    !stockIsFromFallback &&
                    stockHasMore && (
                      <button
                        onClick={() => searchStock(stockQuery, stockPage + 1)}
                        disabled={stockLoading}
                        className="w-full py-1.5! rounded-lg font-label text-[8px] tracking-[0.3em] uppercase text-[#D4AF3790] hover:text-[#D4AF37] border border-[#D4AF3740] hover:border-[#D4AF3760] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {stockLoading ? (
                          <>
                            <Loader2Icon className="size-3 animate-spin" />{" "}
                            Loading…
                          </>
                        ) : (
                          "Load more"
                        )}
                      </button>
                    )}
                </div>

                {stockResults.some(
                  (p) => p.source === "unsplash" || p.source === "pixabay",
                ) && (
                  <p className="font-label text-[7px] tracking-widest uppercase text-[#F5F0E820] text-center">
                    Photos from Unsplash & Pixabay
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
