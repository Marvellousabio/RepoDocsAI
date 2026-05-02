import React from 'react';
import { Github, GithubIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar = () => {
  return (
    <nav className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-50 overflow-hidden">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm tracking-tighter text-white">RD</div>
        <span className="text-xl font-semibold tracking-tight text-white">RepoDocs AI</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        <Button className="px-4 py-2 bg-white text-black rounded-full font-semibold hover:bg-neutral-200 transition-all flex items-center gap-2 h-auto">
          <GithubIcon className="w-4 h-4" />
          Sign In
        </Button>
      </div>
    </nav>
  );
};
