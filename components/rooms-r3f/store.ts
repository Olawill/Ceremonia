import { Course, EventPartyMember, TravelItem } from "@/types/event";
import { create } from "zustand";

interface RoomsState {
  activeRoom: number;
  targetRoom: number;
  isMoving: boolean;
  dateRevealed: boolean;
  peekX: number;
  peekTarget: number;
  zoomOffset: number;
  setZoomOffset: (offset: number) => void;
  // roomPhase: "outside" | "inside";
  navigate: (index: number) => void;
  // enterRoom: () => void;
  setArrived: () => void;
  setDateRevealed: (revealed: boolean) => void;
  setPeek: (target: number) => void;
  setTarget: (target: number) => void;
  reset: () => void;

  openCard: { year: string; icon: string; title: string; desc: string } | null;
  setOpenCard: (
    card: { year: string; icon: string; title: string; desc: string } | null,
  ) => void;

  openHotelIndex: number | null;
  setOpenHotelIndex: (index: number | null) => void;

  openPartyMember: EventPartyMember | null;
  setOpenPartyMember: (member: EventPartyMember | null) => void;

  openFaqIndex: number | null;
  setOpenFaqIndex: (index: number | null) => void;

  openTravelFrame: { items: TravelItem[]; index: number } | null;
  setOpenTravelFrame: (
    frame: { items: TravelItem[]; index: number } | null,
  ) => void;

  openMenuScroll: { courses: Course[]; index: number } | null;
  setOpenMenuScroll: (
    scroll: { courses: Course[]; index: number } | null,
  ) => void;
}

export const useRoomsStore = create<RoomsState>((set) => ({
  activeRoom: 0,
  targetRoom: 0,
  isMoving: false,
  dateRevealed: false,
  peekX: 0,
  peekTarget: 0,
  zoomOffset: 0,
  openCard: null,

  // roomPhase: "outside",
  // enterRoom: () => set({ roomPhase: "inside", isMoving: true }),

  openHotelIndex: null,
  setOpenHotelIndex: (index) => set({ openHotelIndex: index }),

  openTravelFrame: null,
  setOpenTravelFrame: (frame) => set({ openTravelFrame: frame }),

  openMenuScroll: null,
  setOpenMenuScroll: (scroll) => set({ openMenuScroll: scroll }),

  openPartyMember: null,
  setOpenPartyMember: (member) => set({ openPartyMember: member }),

  navigate: (index: number) => set({ targetRoom: index, isMoving: true }),

  setArrived: () =>
    set((state) => ({
      isMoving: false,
      activeRoom: state.targetRoom,
    })),

  setOpenCard: (card) => set({ openCard: card }),

  setDateRevealed: (revealed: boolean) => set({ dateRevealed: revealed }),

  setPeek: (target: number) => set({ peekTarget: target }),

  setZoomOffset: (offset: number) => set({ zoomOffset: offset }),

  setTarget: (target: number) => set({ targetRoom: target }),

  openFaqIndex: null,
  setOpenFaqIndex: (index) => set({ openFaqIndex: index }),

  reset: () =>
    set({
      activeRoom: 0,
      targetRoom: 0,
      isMoving: false,
      peekX: 0,
      peekTarget: 0,
      zoomOffset: 0,
      openHotelIndex: null,
      openPartyMember: null,
      openFaqIndex: null,
      openTravelFrame: null,
      openMenuScroll: null,
    }),
}));
