"use client";

import { EVENT_VOCABULARY } from "@/types/event";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const HERO_PHRASES = [
  {
    opener: "Your",
    noun: "love story",
    adverb: "beautifully",
    verb: "told",
    sub: "wedding",
  },
  {
    opener: "Every",
    noun: "milestone",
    adverb: "perfectly",
    verb: "hosted",
    sub: "birthday",
  },
  {
    opener: "A",
    noun: "new chapter",
    adverb: "beautifully",
    verb: "announced",
    sub: "baby_shower",
  },
  {
    opener: "Your",
    noun: "big day",
    adverb: "unforgettably",
    verb: "shared",
    sub: "bridal_shower",
  },
  {
    opener: "A",
    noun: "lifetime together",
    adverb: "elegantly",
    verb: "celebrated",
    sub: "anniversary",
  },
  {
    opener: "Your",
    noun: "achievement",
    adverb: "beautifully",
    verb: "honoured",
    sub: "graduation",
  },
  {
    opener: "A",
    noun: "blessed occasion",
    adverb: "lovingly",
    verb: "remembered",
    sub: "christening",
  },
  {
    opener: "Your",
    noun: "new home",
    adverb: "warmly",
    verb: "welcomed",
    sub: "housewarming",
  },
  {
    opener: "Every",
    noun: "occasion",
    adverb: "cinematically",
    verb: "told",
    sub: "other",
  },
] as const;

type Phrase = (typeof HERO_PHRASES)[number];

export function HeroHeadline() {
  const [index, setIndex] = useState(0);
  const isAnimating = useRef(false);

  // Refs for the changing parts only
  const openerRef = useRef<HTMLSpanElement>(null);
  const nounRef = useRef<HTMLSpanElement>(null);
  const adverbRef = useRef<HTMLSpanElement>(null);
  const verbRef = useRef<HTMLSpanElement>(null);
  const emojiRef = useRef<HTMLSpanElement>(null);
  const eventRef = useRef<HTMLSpanElement>(null);

  const current: Phrase = HERO_PHRASES[index];
  const vocab = EVENT_VOCABULARY[current.sub as keyof typeof EVENT_VOCABULARY];

  const changingEls = () => [
    openerRef.current,
    emojiRef.current,
    eventRef.current,
    nounRef.current,
    adverbRef.current,
    verbRef.current,
  ];

  const animateIn = () => {
    gsap.fromTo(
      changingEls(),
      { y: 18, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.06,
      },
    );
  };

  const animateOut = (onComplete: () => void) => {
    gsap.to(changingEls(), {
      y: -18,
      opacity: 0,
      duration: 0.38,
      ease: "power2.in",
      stagger: 0.04,
      onComplete,
    });
  };

  // Initial entrance
  useEffect(() => {
    animateIn();
  }, []);

  // Interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAnimating.current) return;
      isAnimating.current = true;

      animateOut(() => {
        setIndex((prev) => (prev + 1) % HERO_PHRASES.length);
        isAnimating.current = false;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Animate in after each index change
  useEffect(() => {
    animateIn();
  }, [index]);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Label — only emoji + eventLabel change */}
      <p className="font-label text-[12px] tracking-[0.5em] uppercase text-[#D4AF37] mb-6">
        <span ref={emojiRef} className="inline-block mr-2">
          {vocab.emoji}
        </span>
        <span ref={eventRef} className="inline-block">
          {vocab.eventLabel}
        </span>
        {/* Static suffix */} invitations, reimagined
      </p>

      {/* Headline — opener is static per phrase group, noun/adverb/verb change */}
      <h1 className="font-display font-light text-[clamp(48px,8vw,96px)] leading-[1.05] tracking-[0.02em] mb-6 max-w-4xl">
        {/* Static opener — doesn't animate since "Your/Every/A" changes
            but is a single short word — include in animation for flow */}
        <span ref={openerRef}>{current.opener} </span>
        <span ref={nounRef} className="inline-block">
          {current.noun}
        </span>
        {", "}
        <br className="hidden sm:block" />
        <span ref={adverbRef} className="inline-block italic text-[#D4AF37]">
          {current.adverb}
        </span>{" "}
        <span ref={verbRef} className="inline-block italic text-[#D4AF37]">
          {current.verb}
        </span>
      </h1>
    </div>
  );
}
