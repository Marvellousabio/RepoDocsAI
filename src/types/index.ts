export interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface Repository {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface AnalysisResult {
  score: number;
  categories: {
    documentation: number;
    security: number;
    seo: number;
    quality: number;
  };
  suggestions: string[];
  readme: string;
}
