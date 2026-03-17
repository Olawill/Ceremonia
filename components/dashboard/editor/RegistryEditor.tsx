"use client";

import {
  CheckIcon,
  ExternalLinkIcon,
  GiftIcon,
  LinkIcon,
  Loader2Icon,
  PlusIcon,
  StoreIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Field, Input, Textarea } from "@/components/ui/FormPrimitives";
import { PlanGate } from "@/components/ui/PlanGate";

import { SectionToggle } from "@/components/dashboard/editor/SectionToggle";
import { formatPrice } from "@/components/sections/Registry";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

import { getVocabulary } from "@/types/event";
import type { WeddingConfig } from "@/types/wedding";

interface RegistryItem {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  productUrl?: string | null;
  retailer?: string | null;
  quantity?: number | null;
  category?: string | null;
  reservedCount?: number;
  purchasedCount?: number;
}

interface ScrapedItem {
  url: string;
  title?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
  retailer?: string | null;
  productUrl?: string | null;
  error?: string;
  // editable fields
  editTitle?: string;
  editPrice?: string;
  editCategory?: string;
  editQuantity?: string;
  selected?: boolean;
}

interface Props {
  config: WeddingConfig;
  onChange: (patch: Partial<WeddingConfig>) => void;
}

const RETAILER_SUGGESTIONS = [
  "Amazon",
  "John Lewis",
  "Anthropologie",
  "Crate & Barrel",
  "IKEA",
  "Etsy",
  "Other",
];

type AddMode = "idle" | "manual" | "link" | "bulk" | "browse";

export function RegistryEditor({ config, onChange }: Props) {
  const { api } = useApi();
  const vocab = getVocabulary(config.eventType);

  const { toast, handleApiError } = useToast();
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>("idle");

  // Single link scrape
  const [singleUrl, setSingleUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  // Bulk scrape
  const [bulkUrls, setBulkUrls] = useState("");

  // Scraped results awaiting confirmation
  const [scrapedItems, setScrapedItems] = useState<ScrapedItem[]>([]);
  const [addingAll, setAddingAll] = useState(false);

  // Page browse (Agency)
  const [browseUrl, setBrowseUrl] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);
  const [browseRetailer, setBrowseRetailer] = useState<string | null>(null);

  // Manual form
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    productUrl: "",
    retailer: "",
    category: "",
    quantity: "1",
    imageUrl: "",
  });
  const [savingNew, setSavingNew] = useState(false);

  const fetchItems = async () => {
    if (!config.id) return;
    const { data } = await api.registry({ weddingId: config.id }).get();
    if (data) setItems(data as RegistryItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [config.id]);

  // ── Scraping ──────────────────────────────────────────────────────

  const scrapeUrls = async (urls: string[]) => {
    setScraping(true);
    const { data, error } = await api.registry.scrape.post({ urls });
    setScraping(false);

    if (error) {
      handleApiError(error, "Failed to fetch product details");
      return;
    }
    if (!data) return;

    const results: ScrapedItem[] = (data as ScrapedItem[]).map((item) => ({
      ...item,
      editTitle: item.title ?? "",
      editPrice: item.price ? (item.price / 100).toFixed(2) : "",
      editCategory: "",
      editQuantity: "1",
      selected: !item.error,
    }));
    setScrapedItems(results);
    setAddMode("idle");
  };

  const handleSingleScrape = async () => {
    if (!singleUrl.trim()) return;
    await scrapeUrls([singleUrl.trim()]);
    setSingleUrl("");
  };

  const handleBrowsePage = async () => {
    if (!browseUrl.trim()) return;
    setBrowsing(true);
    setBrowseError(null);
    try {
      const { data, error } = await api.registry["scrape-page"].post({
        url: browseUrl.trim(),
      });
      if (error) {
        setBrowseError(
          error.value?.message ?? "Could not import from that page.",
        );
        setBrowsing(false);
        return;
      }
      if (data) {
        const d = data as {
          sourceUrl: string;
          retailer: string;
          found: number;
          items: ScrapedItem[];
        };
        setBrowseRetailer(d.retailer);
        const results: ScrapedItem[] = d.items.map((item) => ({
          ...item,
          editTitle: item.title ?? "",
          editPrice: item.price ? (item.price / 100).toFixed(2) : "",
          editCategory: "",
          editQuantity: "1",
          selected: !item.error,
        }));
        setScrapedItems(results);
        setAddMode("idle");
        setBrowseUrl("");
      }
    } catch {
      setBrowseError(
        "Something went wrong. Try individual product URLs instead.",
      );
    }
    setBrowsing(false);
  };

  const handleBulkScrape = async () => {
    const urls = bulkUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
    if (!urls.length) return;
    await scrapeUrls(urls);
    setBulkUrls("");
  };

  // ── Confirm scraped batch ─────────────────────────────────────────

  const handleAddAll = async () => {
    if (!config.id) return;
    setAddingAll(true);
    const selected = scrapedItems.filter((i) => i.selected && !i.error);

    const results = await Promise.allSettled(
      selected.map((item) =>
        api.registry({ weddingId: config.id! }).post({
          title: item.editTitle || item.title || "Gift",
          description: item.description || undefined,
          price: item.editPrice
            ? Math.round(parseFloat(item.editPrice) * 100)
            : (item.price ?? undefined),
          currency: item.currency ?? "USD",
          productUrl: item.productUrl || undefined,
          retailer: item.retailer || undefined,
          category: item.editCategory || undefined,
          quantity: parseInt(item.editQuantity ?? "1") || 1,
          imageUrl: item.imageUrl || undefined,
        }),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.filter((r) => r.status === "fulfilled").length;

    if (failed > 0)
      toast.error(`${failed} item${failed !== 1 ? "s" : ""} failed to add.`);
    if (succeeded > 0)
      toast.success(
        `Added ${succeeded} item${succeeded !== 1 ? "s" : ""} to registry`,
      );

    setScrapedItems([]);
    setAddingAll(false);
    await fetchItems();
  };

  // ── Manual add ───────────────────────────────────────────────────

  const handleManualAdd = async () => {
    if (!newItem.title.trim() || !config.id) return;
    setSavingNew(true);
    const { error } = await api.registry({ weddingId: config.id }).post({
      title: newItem.title.trim(),
      description: newItem.description || undefined,
      price: newItem.price
        ? Math.round(parseFloat(newItem.price) * 100)
        : undefined,
      productUrl: newItem.productUrl || undefined,
      retailer: newItem.retailer || undefined,
      category: newItem.category || undefined,
      quantity: parseInt(newItem.quantity) || 1,
      imageUrl: newItem.imageUrl || undefined,
    });
    if (!error) {
      setNewItem({
        title: "",
        description: "",
        price: "",
        productUrl: "",
        retailer: "",
        category: "",
        quantity: "1",
        imageUrl: "",
      });
      setAddMode("idle");
      toast.success("Item added to registry.");
      await fetchItems();
    }
    setSavingNew(false);
  };

  const handleDelete = async (itemId: string) => {
    setSavingId(itemId);
    const { error } = await api.registry.item({ itemId }).delete();
    if (error) {
      handleApiError(error, "Failed to remove item");
      setSavingId(null);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSavingId(null);
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-5!">
      <SectionToggle
        label="Gift Registry"
        enabled={config.registryEnabled ?? false}
        onToggle={() => onChange({ registryEnabled: !config.registryEnabled })}
        disabledMessage={`Enable to share your ${vocab.registryLabel.toLowerCase()} with guests.`}
      />

      {config.registryEnabled && (
        <>
          {loading ? (
            <p className="font-display italic text-sm text-dash-text/50">
              Loading…
            </p>
          ) : (
            <>
              {/* Existing items */}
              {items.length === 0 &&
                addMode === "idle" &&
                scrapedItems.length === 0 && (
                  <div className="py-10! flex flex-col items-center rounded-xl border border-dashed border-dash-border">
                    <GiftIcon className="size-8 mx-auto mb-3! text-dash-gold/80" />
                    <p className="font-display italic font-semibold text-base text-dash-text/50">
                      No registry items yet
                    </p>
                  </div>
                )}

              <div className="space-y-3!">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4! rounded-xl flex items-start gap-3"
                    style={{
                      background: "#D4AF3708",
                      border: "1px solid #D4AF3760",
                    }}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm text-dash-text truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5! flex-wrap">
                        {item.retailer && (
                          <span className="font-label text-[9px] tracking-widest uppercase text-dash-gold/80">
                            {item.retailer}
                          </span>
                        )}
                        {item.price && (
                          <span className="font-display text-[14px] text-dash-gold/90">
                            {formatPrice(
                              item.price,
                              item.currency ?? "USD",
                              true,
                            )}
                          </span>
                        )}
                        {!!item.purchasedCount && (
                          <span className="font-label text-[9px] tracking-widest uppercase text-green-400/70">
                            ✓ {item.purchasedCount} purchased
                          </span>
                        )}
                        {!!item.reservedCount && (
                          <span className="font-label text-[9px] tracking-widest uppercase text-dash-gold/70">
                            {item.reservedCount} reserved
                          </span>
                        )}
                      </div>
                      {item.productUrl && (
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-label text-[11px] tracking-widest uppercase mt-1 hover:text-dash-gold/90 text-[#D4AF3770] transition-colors"
                        >
                          <ExternalLinkIcon className="size-2.5" /> View product
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={savingId === item.id}
                      className="shrink-0 cursor-pointer p-1.5 rounded-lg hover:bg-red-500/10 text-dash-text/60 hover:text-red-400 transition-colors"
                    >
                      {savingId === item.id ? (
                        <Loader2Icon className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Scraped results review ── */}
              {scrapedItems.length > 0 && (
                <div
                  className="rounded-xl p-4! space-y-4!"
                  style={{
                    background: "#D4AF3705",
                    border: "1px solid #D4AF3730",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-label text-[10px] tracking-[0.4em] uppercase text-dash-gold/70">
                      Review {scrapedItems.filter((i) => i.selected).length}{" "}
                      items
                    </p>
                    {browseRetailer && (
                      <span className="font-label text-[8px] tracking-widest uppercase text-dash-gold/50 ml-2!">
                        from {browseRetailer}
                      </span>
                    )}
                    <button
                      onClick={() => setScrapedItems([])}
                      className="text-dash-text/30 hover:text-dash-text/60 transition-colors"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3!">
                    {scrapedItems.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3! flex gap-3 transition-all"
                        style={{
                          background: item.error
                            ? "#ff000008"
                            : item.selected
                              ? "#D4AF3710"
                              : "#ffffff05",
                          border: `1px solid ${item.error ? "#ff000030" : item.selected ? "#D4AF3730" : "#ffffff10"}`,
                          opacity: item.error ? 0.6 : 1,
                        }}
                      >
                        {/* Checkbox */}
                        {!item.error && (
                          <button
                            onClick={() =>
                              setScrapedItems((prev) =>
                                prev.map((s, j) =>
                                  j === i ? { ...s, selected: !s.selected } : s,
                                ),
                              )
                            }
                            className="shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-all"
                            style={{
                              background: item.selected
                                ? "#D4AF3730"
                                : "transparent",
                              border: `1px solid ${item.selected ? "#D4AF37" : "#D4AF3740"}`,
                            }}
                          >
                            {item.selected && (
                              <CheckIcon className="size-2.5 text-dash-gold" />
                            )}
                          </button>
                        )}

                        {/* Image */}
                        {item.imageUrl && !item.error && (
                          <img
                            src={item.imageUrl}
                            alt={item.editTitle ?? ""}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0 space-y-2!">
                          {item.error ? (
                            <div>
                              <p className="font-display text-xs text-red-400/80 truncate">
                                {item.url}
                              </p>
                              <p className="font-display italic text-xs text-red-400/60">
                                {item.error}
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* Editable title */}
                              <input
                                value={item.editTitle ?? ""}
                                onChange={(e) =>
                                  setScrapedItems((prev) =>
                                    prev.map((s, j) =>
                                      j === i
                                        ? { ...s, editTitle: e.target.value }
                                        : s,
                                    ),
                                  )
                                }
                                className="w-full bg-transparent font-display text-sm font-semibold text-dash-text outline-none border-b border-dash-border/50 focus:border-dash-gold/40 pb-0.5! transition-colors"
                              />
                              <div className="flex gap-2">
                                {item.retailer && (
                                  <span className="font-label text-[9px] tracking-widest uppercase text-dash-gold/60">
                                    {item.retailer}
                                  </span>
                                )}
                                {/* Editable price */}
                                <div className="flex items-center gap-1">
                                  <span className="font-display text-base text-dash-text/40">
                                    £
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.editPrice ?? ""}
                                    onChange={(e) =>
                                      setScrapedItems((prev) =>
                                        prev.map((s, j) =>
                                          j === i
                                            ? {
                                                ...s,
                                                editPrice: e.target.value,
                                              }
                                            : s,
                                        ),
                                      )
                                    }
                                    placeholder="price"
                                    className="w-10 bg-transparent font-display text-base text-dash-gold/80 outline-none border-b border-dash-border/50 focus:border-dash-gold/40 transition-colors"
                                  />
                                </div>
                                {/* Quantity */}
                                <div className="flex items-center gap-1">
                                  <span className="font-display text-base text-dash-text/40">
                                    qty
                                  </span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.editQuantity ?? "1"}
                                    onChange={(e) =>
                                      setScrapedItems((prev) =>
                                        prev.map((s, j) =>
                                          j === i
                                            ? {
                                                ...s,
                                                editQuantity: e.target.value,
                                              }
                                            : s,
                                        ),
                                      )
                                    }
                                    className="w-6 bg-transparent font-display text-base text-dash-text/70 outline-none border-b border-dash-border/50 focus:border-dash-gold/40 transition-colors"
                                  />
                                </div>
                                {/* Category */}
                                <input
                                  value={item.editCategory ?? ""}
                                  onChange={(e) =>
                                    setScrapedItems((prev) =>
                                      prev.map((s, j) =>
                                        j === i
                                          ? {
                                              ...s,
                                              editCategory: e.target.value,
                                            }
                                          : s,
                                      ),
                                    )
                                  }
                                  placeholder="category"
                                  className="flex-1 bg-transparent font-display text-xs text-dash-text/50 outline-none border-b border-dash-border/50 focus:border-dash-gold/40 transition-colors"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddAll}
                    disabled={
                      addingAll ||
                      !scrapedItems.some((i) => i.selected && !i.error)
                    }
                    className="w-full py-3! rounded-xl font-label text-xs tracking-[0.4em] uppercase transition-all dash-btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {addingAll ? (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" />{" "}
                        Adding…
                      </>
                    ) : (
                      <>
                        <CheckIcon className="size-3.5" /> Add{" "}
                        {
                          scrapedItems.filter((i) => i.selected && !i.error)
                            .length
                        }{" "}
                        items to Registry
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ── Add mode selector ── */}
              {addMode === "idle" && scrapedItems.length === 0 && (
                <div className="space-y-2!">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAddMode("link")}
                      className="py-3! rounded-xl font-label text-[10px] tracking-[0.3em] uppercase transition-all border flex flex-col items-center gap-1.5 cursor-pointer"
                      style={{
                        borderColor: "#D4AF3740",
                        color: "#D4AF37",
                        borderStyle: "dashed",
                      }}
                    >
                      <LinkIcon className="size-3.5" />
                      Paste Link
                    </button>
                    <button
                      onClick={() => setAddMode("bulk")}
                      className="py-3! rounded-xl font-label text-[10px] tracking-[0.3em] uppercase transition-all border flex flex-col items-center gap-1.5 cursor-pointer"
                      style={{
                        borderColor: "#D4AF3740",
                        color: "#D4AF37",
                        borderStyle: "dashed",
                      }}
                    >
                      <LinkIcon className="size-3.5" />
                      Bulk Links
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAddMode("manual")}
                      className="py-3! rounded-xl font-label text-[10px] tracking-[0.3em] uppercase transition-all border flex flex-col items-center gap-1.5 cursor-pointer"
                      style={{
                        borderColor: "#D4AF3740",
                        color: "#D4AF37",
                        borderStyle: "dashed",
                      }}
                    >
                      <PlusIcon className="size-3.5" />
                      Manual
                    </button>
                    <PlanGate
                      requires="agency"
                      featureName={`Import from retailer pages`}
                    >
                      <button
                        onClick={() => setAddMode("browse")}
                        className="py-3! rounded-xl font-label text-[10px] w-full tracking-[0.3em] uppercase transition-all border flex flex-col items-center gap-1.5 relative overflow-hidden cursor-pointer disabled:cursor-not-allowed"
                        style={{
                          borderColor: "#D4AF3760",
                          color: "#D4AF37",
                          borderStyle: "solid",
                          background: "#D4AF3708",
                        }}
                      >
                        <StoreIcon className="size-3.5" />
                        Import Page
                        {/* <span
                      className="absolute top-1 right-1 font-label text-[7px] tracking-widest uppercase px-1.5! py-0.5! rounded-full"
                      style={{ background: "#D4AF3720", color: "#D4AF37" }}
                    >
                      Agency
                    </span> */}
                      </button>
                    </PlanGate>
                  </div>
                </div>
              )}

              {/* ── Browse / import from retailer page (Agency) ── */}
              {addMode === "browse" && (
                <div
                  className="p-4! rounded-xl space-y-3!"
                  style={{
                    background: "#D4AF3705",
                    border: "1px solid #D4AF3740",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-label font-bold text-[10px] tracking-[0.4em] uppercase text-dash-gold/70">
                      Import from Retailer Page
                    </p>
                    <span
                      className="font-label text-[8px] tracking-widest uppercase px-2! py-0.5! rounded-full"
                      style={{ background: "#D4AF3720", color: "#D4AF37" }}
                    >
                      Agency
                    </span>
                  </div>
                  <p className="font-display italic text-sm text-dash-text/50">
                    Paste a search results, category, or wishlist page URL.
                    We'll find all products on it automatically.
                  </p>
                  <Field
                    label="Page URL"
                    hint="e.g. amazon.co.uk/s?k=wedding+gifts or johnlewis.com/c/kitchen"
                  >
                    <Input
                      value={browseUrl}
                      onChange={(e) => {
                        setBrowseUrl(e.target.value);
                        setBrowseError(null);
                      }}
                      placeholder="https://www.amazon.co.uk/s?k=kitchen+gifts"
                      autoFocus
                    />
                  </Field>
                  {browseError && (
                    <p className="font-display italic text-xs text-red-400/80">
                      {browseError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleBrowsePage}
                      disabled={!browseUrl.trim() || browsing}
                      className="flex-1 py-3! rounded-xl font-label text-xs font-semibold tracking-[0.4em] uppercase transition-all dash-btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {browsing ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin" />{" "}
                          Scanning page…
                        </>
                      ) : (
                        "Find Products"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAddMode("idle");
                        setBrowseUrl("");
                        setBrowseError(null);
                      }}
                      className="px-4! py-3! rounded-xl font-label font-semibold text-xs tracking-[0.4em] uppercase border border-dash-border text-dash-text/80 hover:text-dash-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Single link ── */}
              {addMode === "link" && (
                <div
                  className="p-4! rounded-xl space-y-3!"
                  style={{
                    background: "#D4AF3705",
                    border: "1px solid #D4AF3730",
                  }}
                >
                  <p className="font-label font-bold text-[10px] tracking-[0.4em] uppercase text-dash-gold/70">
                    Paste Product Link
                  </p>
                  <Field label="Product URL">
                    <Input
                      value={singleUrl}
                      onChange={(e) => setSingleUrl(e.target.value)}
                      placeholder="https://amazon.co.uk/…"
                      autoFocus
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSingleScrape()
                      }
                    />
                  </Field>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSingleScrape}
                      disabled={!singleUrl.trim() || scraping}
                      className="flex-1 py-3! rounded-xl font-label font-semibold text-xs tracking-[0.4em] uppercase transition-all dash-btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {scraping ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin" />{" "}
                          Fetching…
                        </>
                      ) : (
                        "Fetch Details"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAddMode("idle");
                        setSingleUrl("");
                      }}
                      className="px-4! py-3! rounded-xl font-label font-semibold text-xs tracking-[0.4em] uppercase border border-dash-border text-dash-text/80 hover:text-dash-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Bulk links ── */}
              {addMode === "bulk" && (
                <div
                  className="p-4! rounded-xl space-y-3!"
                  style={{
                    background: "#D4AF3705",
                    border: "1px solid #D4AF3730",
                  }}
                >
                  <p className="font-label font-bold text-[10px] tracking-[0.4em] uppercase text-dash-gold/70">
                    Bulk Add Links
                  </p>
                  <Field
                    label="Product URLs"
                    hint="One URL per line — up to 20 at once"
                  >
                    <textarea
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      placeholder={
                        "https://amazon.co.uk/…\nhttps://johnlewis.com/…\nhttps://etsy.com/…"
                      }
                      rows={6}
                      autoFocus
                      className="dash-input resize-none w-full font-display text-sm"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkScrape}
                      disabled={
                        !bulkUrls.trim() ||
                        scraping ||
                        bulkUrls
                          .split("\n")
                          .filter((u) => u.trim().startsWith("http")).length ===
                          0
                      }
                      className="flex-1 py-3! rounded-xl font-label text-xs font-semibold tracking-[0.4em] uppercase transition-all dash-btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {scraping ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin" />{" "}
                          Fetching{" "}
                          {
                            bulkUrls
                              .split("\n")
                              .filter((u) => u.trim().startsWith("http")).length
                          }{" "}
                          links…
                        </>
                      ) : (
                        `Fetch ${bulkUrls.split("\n").filter((u) => u.trim().startsWith("http")).length || ""} Links`
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setAddMode("idle");
                        setBulkUrls("");
                      }}
                      className="px-4! py-3! rounded-xl font-label text-xs font-semibold tracking-[0.4em] uppercase border border-dash-border text-dash-text/80 hover:text-dash-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── Manual form ── */}
              {addMode === "manual" && (
                <div
                  className="p-4! rounded-xl space-y-3!"
                  style={{
                    background: "#D4AF3705",
                    border: "1px solid #D4AF3730",
                  }}
                >
                  <p className="font-label font-bold text-[10px] tracking-[0.4em] uppercase text-dash-gold/70">
                    Add Manually
                  </p>
                  <Field label="Item Name">
                    <Input
                      value={newItem.title}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="KitchenAid Stand Mixer"
                      autoFocus
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Price (£)">
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) =>
                          setNewItem((p) => ({ ...p, price: e.target.value }))
                        }
                        placeholder="49.99"
                      />
                    </Field>
                    <Field label="Quantity Needed">
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem((p) => ({
                            ...p,
                            quantity: e.target.value,
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Retailer">
                    <div className="flex gap-2 flex-wrap mb-1.5">
                      {RETAILER_SUGGESTIONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() =>
                            setNewItem((p) => ({ ...p, retailer: r }))
                          }
                          className="px-2.5! py-1! rounded-full font-label text-[9px] tracking-wider uppercase transition-all"
                          style={
                            newItem.retailer === r
                              ? {
                                  background: "#D4AF3720",
                                  border: "1px solid #D4AF3760",
                                  color: "#D4AF37",
                                }
                              : {
                                  background: "transparent",
                                  border: "1px solid #D4AF3720",
                                  color: "#D4AF3790",
                                }
                          }
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <Input
                      value={newItem.retailer}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, retailer: e.target.value }))
                      }
                      placeholder="or type custom retailer…"
                    />
                  </Field>
                  <Field
                    label="Product Link"
                    hint="Paste the Amazon/retailer URL"
                  >
                    <Input
                      value={newItem.productUrl}
                      onChange={(e) =>
                        setNewItem((p) => ({
                          ...p,
                          productUrl: e.target.value,
                        }))
                      }
                      placeholder="https://amazon.co.uk/…"
                    />
                  </Field>
                  <Field label="Category" hint="e.g. Kitchen, Travel, Home">
                    <Input
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, category: e.target.value }))
                      }
                      placeholder="Kitchen"
                    />
                  </Field>
                  <Field label="Description" hint="Optional — shown to guests">
                    <Textarea
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="The 5qt tilt-head model in Empire Red…"
                      rows={2}
                    />
                  </Field>
                  <Field
                    label="Image URL"
                    hint="Optional — direct link to product image"
                  >
                    <Input
                      value={newItem.imageUrl}
                      onChange={(e) =>
                        setNewItem((p) => ({ ...p, imageUrl: e.target.value }))
                      }
                      placeholder="https://…"
                    />
                  </Field>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleManualAdd}
                      disabled={!newItem.title.trim() || savingNew}
                      className="flex-1 py-3! rounded-xl font-label font-semibold text-xs tracking-[0.4em] uppercase transition-all dash-btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {savingNew ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin" />{" "}
                          Adding…
                        </>
                      ) : (
                        "Add to Registry"
                      )}
                    </button>
                    <button
                      onClick={() => setAddMode("idle")}
                      className="px-4! py-3! rounded-xl font-label font-semibold text-xs tracking-[0.4em] uppercase border border-dash-border text-dash-text/80 hover:text-dash-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
