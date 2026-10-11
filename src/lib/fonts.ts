import { Instrument_Serif } from 'next/font/google';

// The italic serif accent for the one or two words a heading leans on. Only
// pages that use it load it.
export const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic' });
