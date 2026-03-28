export interface ConfettiOptions {
  containerId?: string;
  colors?: string[];
  count?: number;
  fixed?: boolean;
  origin?: { x?: string; y?: string };
}

/** Pure-CSS DOM confetti burst – no canvas-confetti dependency needed. */
export function fireConfetti({
  containerId,
  colors = ["#D4AF37", "#F0D060", "#ffffff", "#6A0D17"],
  count = 100,
  fixed = false,
  origin = {},
}: ConfettiOptions = {}) {
  const container = containerId
    ? document.getElementById(containerId)
    : document.body;

  if (!container) return;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 4;
    const angle = Math.random() * 360;
    const dist = Math.random() * 350 + 100;
    const dx = Math.cos((angle * Math.PI) / 180) * dist;
    const dy = Math.sin((angle * Math.PI) / 180) * dist;
    const duration = 1.4 + Math.random() * 0.8;
    const isCircle = Math.random() > 0.5;

    el.style.cssText = `
      position:${fixed && !containerId ? "fixed" : "absolute"};
      left:${origin.x ?? "50%"};
      top:${origin.y ?? "50%"};
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:${isCircle ? "50%" : "2px"};
      pointer-events:none;
      z-index:9999;
      --dx:${dx}px;
      --dy:${dy}px;
      animation:confettiBurst ${duration}s ease-out forwards;
    `;

    container.appendChild(el);
    setTimeout(() => el.remove(), (duration + 0.1) * 1000);
  }
}
