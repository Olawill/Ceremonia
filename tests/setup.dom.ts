import "@testing-library/jest-dom";

// jsdom doesn't implement matchMedia — GSAP's ScrollTrigger plugin (pulled in
// by components/sections/Accommodation.tsx) probes it at module load time,
// so anything that transitively imports that module needs this stubbed out.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
