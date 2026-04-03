import { create } from "zustand";

interface RoomsState {
  activeRoom: number;
  targetRoom: number;
  isMoving: boolean;
  dateRevealed: boolean;
  peekX: number;
  peekTarget: number;
  // roomPhase: "outside" | "inside";
  navigate: (index: number) => void;
  // enterRoom: () => void;
  setArrived: () => void;
  setDateRevealed: (revealed: boolean) => void;
  setPeek: (target: number) => void;
  setTarget: (target: number) => void;
  reset: () => void;
}

export const useRoomsStore = create<RoomsState>((set) => ({
  activeRoom: 0,
  targetRoom: 0,
  isMoving: false,
  dateRevealed: false,
  peekX: 0,
  peekTarget: 0,
  // roomPhase: "outside",

  navigate: (index: number) => set({ targetRoom: index, isMoving: true }),

  // enterRoom: () => set({ roomPhase: "inside", isMoving: true }),

  setArrived: () =>
    set((state) => ({
      isMoving: false,
      activeRoom: state.targetRoom,
    })),

  setDateRevealed: (revealed: boolean) => set({ dateRevealed: revealed }),

  setPeek: (target: number) => set({ peekTarget: target }),

  setTarget: (target: number) => set({ targetRoom: target }),

  reset: () =>
    set({
      activeRoom: 0,
      targetRoom: 0,
      isMoving: false,
      peekX: 0,
      peekTarget: 0,
      // roomPhase: "outside",
    }),
}));
