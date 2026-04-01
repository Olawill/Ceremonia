import { create } from "zustand";

interface RoomsState {
  activeRoom: number;
  targetRoom: number;
  isMoving: boolean;
  dateRevealed: boolean;
  peekX: number;
  peekTarget: number;
  navigate: (index: number) => void;
  setArrived: (arrived: boolean) => void;
  setDateRevealed: (revealed: boolean) => void;
  setPeek: (target: number) => void;
  setTarget: (target: number) => void;
}

export const useRoomsStore = create<RoomsState>((set) => ({
  activeRoom: 0,
  targetRoom: 0,
  isMoving: false,
  dateRevealed: false,
  peekX: 0,
  peekTarget: 0,

  navigate: (index: number) =>
    set({ targetRoom: index, isMoving: true }),

  setArrived: (arrived: boolean) =>
    set((state) => ({
      isMoving: false,
      activeRoom: arrived ? state.targetRoom : state.activeRoom,
    })),

  setDateRevealed: (revealed: boolean) =>
    set({ dateRevealed: revealed }),

  setPeek: (target: number) =>
    set({ peekTarget: target }),

  setTarget: (target: number) =>
    set({ targetRoom: target }),
}));
