import { create } from "zustand";

interface UIState {
  isHoveringBackground: boolean;
  setIsHoveringBackground: (isHovering: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isHoveringBackground: false,
  setIsHoveringBackground: (isHovering: boolean) => set({ isHoveringBackground: isHovering }),
}));
