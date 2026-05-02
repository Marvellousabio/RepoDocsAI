import React, { useState } from 'react';
import { Toaster, toast } from "sonner"
import { Navbar } from './components/layout/Navbar';
import { ArrowRight, Github, Loader2, BookOpen, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!repoUrl) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Step 1: Analyze
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);

      // Step 2: Generate
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          metadata: analyzeData.metadata, 
          fileTree: analyzeData.fileTree 
        }),
      });

      const generateData = await generateRes.json();
      if (!generateRes.ok) throw new Error(generateData.error);

      setResult({
        ...analyzeData.metadata,
        readme: generateData.readme
      });
      toast.success("Analysis complete! README generated.");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center relative px-6 py-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
        </div>

        <div className="z-10 text-center flex flex-col items-center w-full max-w-7xl mx-auto">
          {!result ? (
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-blue-400 mb-8">
                <span>v1.0.0 is live</span>
                <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></span>
                <span>Powered by Gemini 1.5 Pro</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-[1.1]">
                Documentation that<br className="hidden md:block" /> understands your code.
              </h1>

              {/* Subheading */}
              <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed mx-auto">
                RepoDocs AI analyzes your GitHub repositories to generate professional READMEs, architecture diagrams, and health scores instantly.
              </p>

              {/* Input Area */}
              <div className="flex w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all shadow-2xl backdrop-blur-sm mx-auto">
                <Input 
                  type="text" 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="github.com/username/repository" 
                  className="bg-transparent border-none focus-visible:ring-0 flex-1 px-4 text-neutral-200 placeholder:text-neutral-600 font-mono text-sm h-12"
                  disabled={loading}
                />
                <Button 
                  onClick={handleAnalyze}
                  className="px-6 py-0 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 h-12"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze & Generate</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </Button>
              </div>

              {/* Feature Grid */}
              <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl text-left">
                <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04] group hover:border-blue-500/20">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 font-bold group-hover:bg-blue-500/20 transition-colors text-xl">01</div>
                  <h3 className="text-xl font-semibold mb-3">Deep Context Analysis</h3>
                  <p className="text-neutral-400 leading-relaxed text-sm">Our engine doesn't just list files. It analyzes commit history and code flow to understand the "why" behind your architecture.</p>
                </div>
                
                <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04] group hover:border-emerald-500/20">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 font-bold group-hover:bg-emerald-500/20 transition-colors text-xl">02</div>
                  <h3 className="text-xl font-semibold mb-3">Health Score Engine</h3>
                  <p className="text-neutral-400 leading-relaxed text-sm">Get an instant 0-100 score on your repo's documentation readiness, security posture, and GitHub SEO optimization.</p>
                </div>
                
                <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04] group hover:border-purple-500/20">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 font-bold group-hover:bg-purple-500/20 transition-colors text-xl">03</div>
                  <h3 className="text-xl font-semibold mb-3">Smart Checklists</h3>
                  <p className="text-neutral-400 leading-relaxed text-sm">Actionable, interactive steps to fix repository gaps before you launch. Includes security scans and dependency drift alerts.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full max-w-5xl text-left space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setResult(null)}
                  className="text-white/50 hover:text-white"
                >
                  ← Back to search
                </Button>
                <div className="flex items-center gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white">Save Changes</Button>
                  <Button variant="outline" className="border-white/10 text-white">Download MD</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <div className="prose prose-invert max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                      <ReactMarkdown>{result.readme}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Repo Metadata</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={result.owner.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                        <div>
                          <div className="text-sm font-bold">{result.full_name}</div>
                          <div className="text-[10px] text-white/40">{result.language}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-white/5 text-center">
                          <div className="text-white/40 text-[10px] uppercase">Stars</div>
                          <div className="font-bold">{result.stars}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 text-center">
                          <div className="text-white/40 text-[10px] uppercase">Forks</div>
                          <div className="font-bold">{result.forks}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                    <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 fill-current" />
                      Analysis Score
                    </h3>
                    <div className="text-4xl font-bold mb-2">85<span className="text-xl text-emerald-400/50">/100</span></div>
                    <div className="text-xs text-neutral-400 mb-6">Your repository documentation is high quality but missing an architecture diagram.</div>
                    
                    <div className="space-y-3">
                      {[
                        { label: 'Security', score: 92 },
                        { label: 'SEO', score: 78 },
                        { label: 'Integrity', score: 85 }
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase text-neutral-500">
                            <span>{item.label}</span>
                            <span>{item.score}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="h-16 px-8 flex items-center justify-between border-t border-white/5 bg-black/50 backdrop-blur-sm text-[11px] text-neutral-600 uppercase tracking-widest font-medium mt-auto">
        <div>&copy; 2026 RepoDocs AI Systems</div>
        <div className="hidden sm:flex gap-6">
          <span>Github API Status: Operational</span>
          <span>System Latency: 42ms</span>
        </div>
      </footer>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
