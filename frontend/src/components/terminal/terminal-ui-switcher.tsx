"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Star, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ButtonGroup } from "@/components/ui/button-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";

const TERMINAL_UIS = ["Classic", "Modern", "Bloomberg", "Matrix"];

export function TerminalUISwitcher() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [favoriteUI, setFavoriteUI] = React.useState<string | null>(null);
  const [showAlert, setShowAlert] = React.useState(false);

  // Load favorite from local storage on mount
  React.useEffect(() => {
    const savedFavorite = localStorage.getItem("swordfish_terminal_favorite");
    if (savedFavorite) {
      setFavoriteUI(savedFavorite);
      const index = TERMINAL_UIS.indexOf(savedFavorite);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, []);

  const currentUI = TERMINAL_UIS[currentIndex];
  const isFavorite = favoriteUI === currentUI;

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + TERMINAL_UIS.length) % TERMINAL_UIS.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TERMINAL_UIS.length);
  };

  const handleToggleFavorite = () => {
    if (isFavorite) {
      // Unstar
      setFavoriteUI(null);
      localStorage.removeItem("swordfish_terminal_favorite");
    } else {
      // Star new one
      if (favoriteUI) {
        // If there was already a favorite, show alert
        setShowAlert(true);
        // Auto-hide alert after 3 seconds
        setTimeout(() => setShowAlert(false), 3000);
      }
      setFavoriteUI(currentUI);
      localStorage.setItem("swordfish_terminal_favorite", currentUI);
    }
  };

  return (
    <div className="relative flex items-center">
      <ButtonGroup>
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="w-32">
          <Input
            value={currentUI}
            readOnly
            className="h-full rounded-none border-x-0 text-center focus-visible:ring-0"
          />
        </div>
        <Toggle
          pressed={isFavorite}
          onPressedChange={handleToggleFavorite}
          className="rounded-none border-y border-r border-l-0 px-3 hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          aria-label="Toggle favorite"
        >
          <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </Toggle>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </ButtonGroup>

      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 z-50 w-80"
          >
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Favorite Updated</AlertTitle>
              <AlertDescription>
                Only one UI can be starred. The previous favorite has been
                unstarred.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
