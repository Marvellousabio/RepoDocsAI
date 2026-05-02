import { Repository, IRepository } from '../models/Repository.js';

/**
 * Repository Service
 * Provides CRUD operations and business logic for repository management
 */

export interface CreateRepositoryData {
  githubId: number;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  htmlUrl: string;
  cloneUrl: string;
  language?: string;
  stars: number;
  forks: number;
  watchers: number;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  pushedAt?: Date;
  owner: {
    login: string;
    id: number;
    avatarUrl: string;
    htmlUrl: string;
    type: string;
  };
  topics?: string[];
  license?: {
    key: string;
    name: string;
    spdxId?: string;
    url?: string;
  };
  fileTree?: Array<{
    name: string;
    type: 'file' | 'dir';
    path: string;
    size?: number;
    downloadUrl?: string;
  }>;
}

export interface UpdateRepositoryData {
  description?: string;
  stars?: number;
  forks?: number;
  watchers?: number;
  size?: number;
  updatedAt?: Date;
  pushedAt?: Date;
  topics?: string[];
  fileTree?: Array<{
    name: string;
    type: 'file' | 'dir';
    path: string;
    size?: number;
    downloadUrl?: string;
  }>;
}

/**
 * Create a new repository
 */
export async function createRepository(data: CreateRepositoryData): Promise<IRepository> {
  try {
    const repository = new Repository({
      ...data,
      analysisStatus: 'pending'
    });
    return await repository.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Repository already exists');
    }
    throw error;
  }
}

/**
 * Find repository by ID
 */
export async function getRepositoryById(id: string): Promise<IRepository | null> {
  try {
    return await Repository.findById(id);
  } catch (error) {
    throw new Error(`Failed to find repository: ${error.message}`);
  }
}

/**
 * Find repository by GitHub ID
 */
export async function getRepositoryByGithubId(githubId: number): Promise<IRepository | null> {
  try {
    return await Repository.findOne({ githubId });
  } catch (error) {
    throw new Error(`Failed to find repository: ${error.message}`);
  }
}

/**
 * Find repository by full name (owner/repo)
 */
export async function getRepositoryByFullName(fullName: string): Promise<IRepository | null> {
  try {
    return await Repository.findByFullName(fullName);
  } catch (error) {
    throw new Error(`Failed to find repository: ${error.message}`);
  }
}

/**
 * Update repository information
 */
export async function updateRepository(id: string, data: UpdateRepositoryData): Promise<IRepository | null> {
  try {
    return await Repository.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error(`Failed to update repository: ${error.message}`);
  }
}

/**
 * Update repository with analysis results
 */
export async function updateRepositoryAnalysis(
  id: string,
  fileTree: Array<{
    name: string;
    type: 'file' | 'dir';
    path: string;
    size?: number;
    downloadUrl?: string;
  }>,
  success: boolean = true,
  error?: string
): Promise<IRepository | null> {
  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return null;
    }

    repository.fileTree = fileTree;
    repository.markAsAnalyzed(success, error);
    return await repository.save();
  } catch (error) {
    throw new Error(`Failed to update repository analysis: ${error.message}`);
  }
}

/**
 * Delete repository
 */
export async function deleteRepository(id: string): Promise<boolean> {
  try {
    const result = await Repository.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    throw new Error(`Failed to delete repository: ${error.message}`);
  }
}

/**
 * Get repositories with pagination and filtering
 */
export interface RepositoryQuery {
  owner?: string;
  language?: string;
  minStars?: number;
  maxStars?: number;
  analysisStatus?: 'pending' | 'completed' | 'failed';
  sortBy?: 'stars' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export async function getRepositories(query: RepositoryQuery = {}): Promise<{
  repositories: IRepository[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const {
      owner,
      language,
      minStars,
      maxStars,
      analysisStatus,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = query;

    // Build filter
    const filter: any = {};
    if (owner) filter['owner.login'] = owner;
    if (language) filter.language = language;
    if (minStars !== undefined || maxStars !== undefined) {
      filter.stars = {};
      if (minStars !== undefined) filter.stars.$gte = minStars;
      if (maxStars !== undefined) filter.stars.$lte = maxStars;
    }
    if (analysisStatus) filter.analysisStatus = analysisStatus;

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const repositories = await Repository
      .find(filter)
      .sort(sort)
      .limit(limit)
      .skip(offset);

    const total = await Repository.countDocuments(filter);
    const hasMore = offset + limit < total;

    return { repositories, total, hasMore };
  } catch (error) {
    throw new Error(`Failed to get repositories: ${error.message}`);
  }
}

/**
 * Get popular repositories
 */
export async function getPopularRepositories(limit = 10): Promise<IRepository[]> {
  try {
    return await Repository.findPopular(limit);
  } catch (error) {
    throw new Error(`Failed to get popular repositories: ${error.message}`);
  }
}

/**
 * Get recently analyzed repositories
 */
export async function getRecentRepositories(limit = 10): Promise<IRepository[]> {
  try {
    return await Repository.findRecent(limit);
  } catch (error) {
    throw new Error(`Failed to get recent repositories: ${error.message}`);
  }
}

/**
 * Get repository statistics
 */
export async function getRepositoryStats(): Promise<{
  total: number;
  analyzed: number;
  pending: number;
  failed: number;
  languages: Array<{ _id: string; count: number }>;
}> {
  try {
    const [total, analyzed, pending, failed, languages] = await Promise.all([
      Repository.countDocuments(),
      Repository.countDocuments({ analysisStatus: 'completed' }),
      Repository.countDocuments({ analysisStatus: 'pending' }),
      Repository.countDocuments({ analysisStatus: 'failed' }),
      Repository.aggregate([
        { $match: { language: { $exists: true, $ne: null } } },
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return { total, analyzed, pending, failed, languages };
  } catch (error) {
    throw new Error(`Failed to get repository stats: ${error.message}`);
  }
}