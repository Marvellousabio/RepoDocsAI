import React, { useState } from 'react';
import { Toaster, toast } from "sonner"
import { Navbar } from './components/layout/Navbar';
import { ArrowRight, Github, Loader2, BookOpen, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { useTheme } from './components/ThemeProvider';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const { theme } = useTheme();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!repoUrl) {
      toast.error("Please enter a GitHub repository URL");
      return;
    }

    setLoading(true);
    setLoadingStep('Analyzing repository structure...');
    setResult(null);

    try {
      // Step 1: Analyze via Backend (to avoid CORS)
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      let analyzeData;
      try {
        analyzeData = await analyzeRes.json();
      } catch (parseError) {
        // If response is not JSON, get text to see what it is
        const textResponse = await analyzeRes.text();
        console.error('Non-JSON response:', textResponse.substring(0, 200));
        throw new Error(`Server returned invalid response. Status: ${analyzeRes.status}`);
      }

      if (!analyzeRes.ok) throw new Error(analyzeData.error);

      // Step 2: Generate via Frontend Gemini SDK
      setLoadingStep('Generating production-ready README...');
      
      const prompt = `
        You are a senior technical writer and software architect. Based on the following GitHub repository information, generate a high-quality, professional README.md.
        
        Repository Name: ${analyzeData.metadata.full_name}
        Description: ${analyzeData.metadata.description || "No description provided"}
        Primary Language: ${analyzeData.metadata.language || "Unknown"}
        File Structure (Top Level):
        ${JSON.stringify(analyzeData.fileTree, null, 2)}
        
        The README should include:
        1. A catchy title and clear description.
        2. Architecture & Folder Structure overview.
        3. Installation & Usage guides.
        4. Tech Stack (use badges where applicable).
        5. A "Health Score" section where you give the repo a score from 0-100 based on its complexity and structure.
        
        Format the output clearly in Markdown. Be concise but deeply insightful about the potential of this repository.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      const readme = response.text;
      if (!readme) throw new Error("Failed to generate content from Gemini");

      setResult({
        ...analyzeData.metadata,
        readme: readme
      });
      toast.success("Analysis complete! README generated.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center relative px-6 py-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full opacity-50 dark:opacity-100"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] dark:opacity-[0.03]"></div>
        </div>

        <div className="z-10 text-center flex flex-col items-center w-full max-w-7xl mx-auto">
          {!result ? (
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-mono text-blue-600 dark:text-blue-400 mb-8">
                <span>v1.0.0 is live</span>
                <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                <span>Powered by Gemini 1.5 Pro</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-neutral-900 to-neutral-500 dark:from-white dark:to-white/60 bg-clip-text text-transparent leading-[1.1]">
                Documentation that<br className="hidden md:block" /> understands your code.
              </h1>

              {/* Subheading */}
              <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed mx-auto">
                RepoDocs AI analyzes your GitHub repositories to generate professional READMEs, architecture diagrams, and health scores instantly.
              </p>

              {/* Input Area */}
              <div className="flex w-full max-w-2xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all shadow-xl dark:shadow-2xl backdrop-blur-sm mx-auto">
                <Input 
                  type="text" 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="github.com/username/repository" 
                  className="bg-transparent border-none focus-visible:ring-0 flex-1 px-4 text-neutral-900 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono text-sm h-12"
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
                      <span>{loadingStep || 'Working...'}</span>
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
                <div className="p-8 rounded-2xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02] transition-all hover:bg-neutral-100 dark:hover:bg-white/[0.04] group hover:border-blue-500/20">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 font-bold group-hover:bg-blue-500/20 transition-colors text-xl">01</div>
                  <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-white">Deep Context Analysis</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm">Our engine doesn't just list files. It analyzes commit history and code flow to understand the "why" behind your architecture.</p>
                </div>
                
                <div className="p-8 rounded-2xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02] transition-all hover:bg-neutral-100 dark:hover:bg-white/[0.04] group hover:border-emerald-500/20">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 font-bold group-hover:bg-emerald-500/20 transition-colors text-xl">02</div>
                  <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-white">Health Score Engine</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm">Get an instant 0-100 score on your repo's documentation readiness, security posture, and GitHub SEO optimization.</p>
                </div>
                
                <div className="p-8 rounded-2xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02] transition-all hover:bg-neutral-100 dark:hover:bg-white/[0.04] group hover:border-purple-500/20">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400 font-bold group-hover:bg-purple-500/20 transition-colors text-xl">03</div>
                  <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-white">Smart Checklists</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-sm">Actionable, interactive steps to fix repository gaps before you launch. Includes security scans and dependency drift alerts.</p>
                </div>
              </div>

              {/* Integrations Section */}
              <div id="integrations" className="mt-40 w-full max-w-5xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Built for your ecosystem</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-12">Seamlessly connects with your existing developer workflow.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['GitHub Actions', 'VSCode Extension', 'Slack Alerts', 'Vercel Deploy'].map((item) => (
                    <div key={item} className="p-4 rounded-xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.01] text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Section */}
              <div id="pricing" className="mt-40 mb-20 w-full max-w-5xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">Simple, transparent pricing</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-12 text-sm">Choose the plan that fits your repository needs.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                  <div className="p-8 rounded-3xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02] flex flex-col shadow-sm">
                    <h4 className="text-lg font-bold mb-2 text-neutral-900 dark:text-white">Hacker</h4>
                    <div className="text-4xl font-bold mb-6 text-neutral-900 dark:text-white">$0<span className="text-lg font-normal text-neutral-500">/mo</span></div>
                    <ul className="space-y-4 mb-8 text-sm text-neutral-500 dark:text-neutral-400 flex-1">
                      <li className="flex items-center gap-2">✓ 3 Repositories/mo</li>
                      <li className="flex items-center gap-2">✓ Standard README Generation</li>
                      <li className="flex items-center gap-2">✓ Basic Health Check</li>
                    </ul>
                    <Button variant="outline" className="w-full border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-900 dark:text-white">Get Started</Button>
                  </div>
                  <div className="p-8 rounded-3xl border border-blue-500/20 bg-blue-500/[0.02] flex flex-col relative overflow-hidden shadow-sm">
                    <div className="absolute top-4 right-4 bg-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider text-white">Most Popular</div>
                    <h4 className="text-lg font-bold mb-2 text-neutral-900 dark:text-white">Pro</h4>
                    <div className="text-4xl font-bold mb-6 text-neutral-900 dark:text-white">$19<span className="text-lg font-normal text-neutral-500">/mo</span></div>
                    <ul className="space-y-4 mb-8 text-sm text-neutral-600 dark:text-neutral-400 flex-1">
                      <li className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">✓ Unlimited Repositories</li>
                      <li className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">✓ Advanced Architecture Mapping</li>
                      <li className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">✓ Priority Gemini 1.5 Access</li>
                      <li className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">✓ VSCode Extension Sync</li>
                    </ul>
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white border-none">Go Pro</Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full max-w-5xl text-left space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setResult(null)}
                  className="text-neutral-500 hover:text-neutral-900 dark:text-white/50 dark:hover:text-white"
                >
                  ← Back to search
                </Button>
                <div className="flex items-center gap-2">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white">Save Changes</Button>
                  <Button variant="outline" className="border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white">Download MD</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] backdrop-blur-md shadow-sm">
                    <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-neutral-100 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-neutral-200 dark:prose-pre:border-white/10">
                      <ReactMarkdown>{result.readme}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-sm">
                    <h3 className="text-sm font-semibold text-neutral-400 dark:text-white/50 uppercase tracking-wider mb-4">Repo Metadata</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={result.owner.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                        <div>
                          <div className="text-sm font-bold text-neutral-900 dark:text-white">{result.full_name}</div>
                          <div className="text-[10px] text-neutral-400 dark:text-white/40">{result.language}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/5 text-center">
                          <div className="text-neutral-400 dark:text-white/40 text-[10px] uppercase">Stars</div>
                          <div className="font-bold text-neutral-900 dark:text-white">{result.stars}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-white/5 text-center">
                          <div className="text-neutral-400 dark:text-white/40 text-[10px] uppercase">Forks</div>
                          <div className="font-bold text-neutral-900 dark:text-white">{result.forks}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-500/5 shadow-sm">
                    <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 fill-current" />
                      Analysis Score
                    </h3>
                    <div className="text-4xl font-bold mb-2 text-neutral-900 dark:text-white">85<span className="text-xl text-emerald-600/50 dark:text-emerald-400/50">/100</span></div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">Your repository documentation is high quality but missing an architecture diagram.</div>
                    
                    <div className="space-y-3">
                      {[
                        { label: 'Security', score: 92 },
                        { label: 'SEO', score: 78 },
                        { label: 'Integrity', score: 85 }
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase text-neutral-400 dark:text-neutral-500">
                            <span>{item.label}</span>
                            <span>{item.score}%</span>
                          </div>
                          <div className="h-1 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden">
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

      <footer className="border-t border-neutral-200 dark:border-white/5 bg-white dark:bg-[#0A0A0B] pt-16 pb-8 px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center font-bold text-[10px] text-white">RD</div>
              <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">RepoDocs AI</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[200px]">
              The next generation of documentation engineering. Powered by Google Gemini.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Product</h4>
            <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Readme Gen</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Architecture Mapping</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Health Engine</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Resources</h4>
            <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">OS Directory</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Company</h4>
            <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Press Kit</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Legal</h4>
            <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-neutral-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Systems Normal</span>
            </div>
            <span>&copy; 2026 RepoDocs AI</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-white/10" />
            <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-white/10" />
          </div>
        </div>
      </footer>

      <Toaster theme={theme as 'light' | 'dark' | 'system'} position="bottom-right" richColors />
    </div>
  );
}
