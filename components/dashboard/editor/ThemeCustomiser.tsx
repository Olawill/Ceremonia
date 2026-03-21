"use client";

import { GlobeIcon, Loader2Icon, SaveIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";

import type { EventConfig } from "@/types/event";
import { EventTheme } from "@/types/theme";

const COLOR_FIELDS: { key: keyof EventTheme; label: string }[] = [
  { key: "curtain", label: "Curtain" },
  { key: "curtainDark", label: "Curtain Shadow" },
  { key: "curtainSheen", label: "Curtain Highlight" },
  { key: "gold", label: "Gold Accent" },
  { key: "goldLight", label: "Gold Light" },
  { key: "bg", label: "Background" },
  { key: "bgMid", label: "Background Mid" },
  { key: "text", label: "Text" },
];

interface SavedCustomTheme {
  id: string;
  name: string;
  theme: EventTheme;
  isPublic: boolean;
}

interface Props {
  config: EventConfig;
  onChange: (patch: Partial<EventConfig>) => void;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  ownerPlan?: string;
}

const DEFAULT_CUSTOM_THEME: Omit<EventTheme, "key" | "name"> = {
  curtain: "#6A0D17",
  curtainDark: "#3D0610",
  curtainSheen: "#9B1525",
  gold: "#D4AF37",
  goldLight: "#F0D060",
  bg: "#0A0A0A",
  bgMid: "#120808",
  text: "#F5F0E8",
  particle: "rgba(212,175,55,0.4)",
};

const PANEL_COUNT_OPTIONS = [3, 4, 5, 6, 7, 8] as const;
const BLADE_COUNT_OPTIONS = [2, 4, 6, 8, 10, 12] as const;

export function ThemeCustomiser({
  config,
  onChange,
  previewIframeRef,
  ownerPlan,
}: Props) {
  const { api } = useApi();
  const { toast, handleApiError } = useToast();
  const [themeName, setThemeName] = useState("My Custom Theme");
  const [colors, setColors] = useState<Omit<EventTheme, "key" | "name">>(
    config.customTheme ?? DEFAULT_CUSTOM_THEME,
  );
  const [savedThemes, setSavedThemes] = useState<SavedCustomTheme[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasMountedRef = useRef(false);

  // Load saved themes on mount
  useEffect(() => {
    api["custom-themes"].get().then(({ data }) => {
      if (data) setSavedThemes(data as SavedCustomTheme[]);
      setLoading(false);
    });
  }, []);

  const sendThemePreview = useCallback(
    (themeColors: Omit<EventTheme, "key" | "name">, name: string) => {
      const iframe = previewIframeRef.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        {
          type: "THEME_UPDATE",
          theme: { key: "custom", name, ...themeColors } as EventTheme,
        },
        "*",
      );
    },
    [previewIframeRef],
  );

  const updateColor = useCallback(
    (key: keyof EventTheme, value: string) => {
      setColors((prev) => {
        const next = { ...prev, [key]: value };
        sendThemePreview(next, themeName);
        return next;
      });
    },
    [sendThemePreview, themeName],
  );

  const handleSave = async () => {
    setSaving(true);
    const builtTheme: EventTheme = {
      key: "custom",
      name: themeName,
      ...colors,
    };

    // Persist into event config so it's included in the next Save
    onChange({ customTheme: builtTheme, themeKey: "custom" });

    const { data, error } = await api["custom-themes"].post({
      name: themeName,
      theme: builtTheme,
    });

    if (error) {
      handleApiError(error, "Failed to save theme");
    } else if (data) {
      setSavedThemes((prev) => [...prev, data as SavedCustomTheme]);
      toast.success(`Theme "${themeName}" saved`);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await api["custom-themes"]({ id }).delete();
    setSavedThemes((prev) => prev.filter((t) => t.id !== id));
  };

  const applyTheme = (saved: SavedCustomTheme) => {
    setColors(saved.theme);
    setThemeName(saved.name);
    sendThemePreview(saved.theme, saved.name);
    onChange({ customTheme: saved.theme, themeKey: "custom" });
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    await api["custom-themes"]({ id }).patch({ isPublic });
    setSavedThemes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPublic } : t)),
    );
  };

  return (
    <div className="space-y-5!">
      {/* Saved themes */}
      {!loading && savedThemes.length > 0 && (
        <div className="space-y-2!">
          <p className="font-label text-[10px] tracking-[0.4em] uppercase text-[#D4AF37]">
            Saved Themes
          </p>
          <div className="flex flex-col gap-1.5">
            {savedThemes.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-[#D4AF3790] px-3! py-2! group"
              >
                {/* Color preview dots */}
                <div className="flex gap-1 shrink-0">
                  {[t.theme.curtain, t.theme.gold, t.theme.bg].map((c) => (
                    <div
                      key={c}
                      className="size-3 rounded-full border border-white/80"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span
                  className="font-display italic text-sm text-[#F5F0E8] flex-1 cursor-pointer"
                  onClick={() => applyTheme(t)}
                >
                  {t.name}
                </span>
                {ownerPlan === "agency" && (
                  <button
                    onClick={() => handleTogglePublic(t.id, !t.isPublic)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#D4AF3760] hover:text-[#D4AF37] ml-1"
                    title={t.isPublic ? "Make private" : "Share to marketplace"}
                  >
                    <GlobeIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#D4AF3780] hover:text-[#D4AF37]"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-px bg-linear-to-r from-transparent via-[#D4AF3720] to-transparent" />

      {/* Panel count — cascade only */}
      {config.curtainStyle === "cascade" && (
        <>
          <p className="font-label text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">
            Panel Count
          </p>
          <div className="flex gap-2">
            {PANEL_COUNT_OPTIONS.map((n) => {
              const active =
                config.customTheme?.panelCount === n ||
                (!config.customTheme?.panelCount && n === 5);
              return (
                <button
                  key={n}
                  onClick={() =>
                    onChange({
                      customTheme: {
                        ...(config.customTheme ?? {
                          key: "custom",
                          name: "custom",
                          ...DEFAULT_CUSTOM_THEME,
                        }),
                        panelCount: n,
                      },
                    })
                  }
                  className="flex-1 py-2! rounded-lg border font-label text-[11px] tracking-widest transition-all"
                  style={{
                    borderColor: active ? "#D4AF3790" : "#D4AF3760",
                    background: active ? "#D4AF3715" : "transparent",
                    color: active ? "#D4AF37" : "#D4AF3780",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="h-px bg-linear-to-r from-transparent via-[#D4AF3720] to-transparent" />
        </>
      )}

      {/* Panel count — cascade only */}
      {config.curtainStyle === "iris" && (
        <>
          <p className="font-label text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">
            Blade Count
          </p>
          <div className="flex gap-2">
            {BLADE_COUNT_OPTIONS.map((n) => {
              const active =
                config.customTheme?.bladeCount === n ||
                (!config.customTheme?.bladeCount && n === 8);
              return (
                <button
                  key={n}
                  onClick={() =>
                    onChange({
                      customTheme: {
                        ...(config.customTheme ?? {
                          key: "custom",
                          name: "custom",
                          ...DEFAULT_CUSTOM_THEME,
                        }),
                        bladeCount: n,
                      },
                    })
                  }
                  className="flex-1 py-2! rounded-lg border font-label text-[11px] tracking-widest transition-all"
                  style={{
                    borderColor: active ? "#D4AF3790" : "#D4AF3760",
                    background: active ? "#D4AF3715" : "transparent",
                    color: active ? "#D4AF37" : "#D4AF3780",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="h-px bg-linear-to-r from-transparent via-[#D4AF3720] to-transparent" />
        </>
      )}

      {/* Color pickers */}
      <p className="font-label text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]">
        Colours
      </p>

      <div className="space-y-3!">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <label
              htmlFor={`color-${key}`}
              className="font-display italic text-sm font-semibold text-[#F5F0E8] w-36 shrink-0"
            >
              {label}
            </label>
            <div className="flex items-center gap-2 flex-1">
              <input
                id={`color-${key}`}
                type="color"
                value={colors[key as keyof typeof colors] as string}
                onChange={(e) => updateColor(key, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={colors[key as keyof typeof colors] as string}
                onChange={(e) => updateColor(key, e.target.value)}
                className="flex-1 bg-[#F5F0E808] border border-[#D4AF3720] rounded-lg px-3 py-1.5 font-mono text-xs text-[#F5F0E8] outline-none focus:border-[#D4AF3740]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-[#D4AF3720] to-transparent" />

      {/* Save */}
      <div className="space-y-2!">
        <input
          type="text"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          placeholder="Theme name"
          className="w-full bg-[#F5F0E808] border border-[#D4AF3740] rounded-lg px-3! py-2! font-display italic text-sm text-[#F5F0E8] outline-none focus:border-[#D4AF3740] placeholder:text-[#F5F0E840]"
        />
        <button
          onClick={handleSave}
          disabled={saving || !themeName.trim()}
          className="flex items-center justify-center gap-2 w-full py-2.5! rounded-xl border border-[#D4AF3780] text-[#D4AF37] font-label text-[12px] tracking-[0.4em] uppercase transition-colors hover:border-[#D4AF37] hover:bg-[#D4AF3710] disabled:opacity-50"
        >
          {saving ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <SaveIcon className="size-3.5" />
          )}
          Save Theme
        </button>
      </div>
    </div>
  );
}
