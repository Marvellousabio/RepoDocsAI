import React from 'react';
import { GithubIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ModeToggle';

export const Navbar = () => {
  return (
    <nav className="h-20 px-8 flex items-center justify-between border-b border-neutral-200 dark:border-white/5 bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50 overflow-hidden">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm tracking-tighter text-white">RD</div>
        <span className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">RepoDocs AI</span>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</a>
        <a href="#integrations" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Integrations</a>
        <a href="#pricing" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Pricing</a>
        <div className="h-4 w-px bg-neutral-200 dark:bg-white/10 mx-2" />
        <ModeToggle />
        <Button className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all flex items-center gap-2 h-auto ml-2">
          <GithubIcon className="w-4 h-4" />
          Sign In
        </Button>
      </div>
    </nav>
  );
};
