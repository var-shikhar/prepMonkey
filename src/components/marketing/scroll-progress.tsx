'use client';

import { motion, useScroll, useSpring } from 'motion/react';

/** A thin brand-gradient bar across the top of the window that fills as you scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div aria-hidden className="bg-gradient-brand fixed inset-x-0 top-0 z-50 h-[3px] origin-left print:hidden" style={{ scaleX }} />;
}
