"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/common/navbar";

export function Header() {
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;

    // Hide when scrolling down, show when scrolling up
    if (latest > previous && latest > 10) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  // Don't show header on login page - Move after hooks to satisfy Rules of Hooks
  if (pathname === "/login") return null;

  return (
    <motion.header
      className="sticky top-0 z-50 w-full text-foreground"
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-center gap-4">
          <Link href="/" className="flex items-center">
            <motion.div
              layoutId="header-logo"
              layout="position"
              className="flex items-center will-change-transform"
            >
              <Image
                src="/mk3LogoTransparent.png"
                // src="/cleaned_up_logo.svg"
                alt="Swordfish Logo"
                width={40}
                height={40}
                priority
                fetchPriority="high"
                className="h-10 w-auto"
              />
            </motion.div>
          </Link>
          <Navbar />
        </div>
      </div>
    </motion.header>
  );
}
