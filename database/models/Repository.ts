import mongoose, { Schema, Document } from 'mongoose';

/**
 * Repository Document Interface
 */
export interface IRepository extends Document {
  _id: mongoose.Types.ObjectId;
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
  // Embedded file tree for better read performance
  fileTree: Array<{
    name: string;
    type: 'file' | 'dir';
    path: string;
    size?: number;
    downloadUrl?: string;
  }>;
  // Analysis metadata
  lastAnalyzed?: Date;
  analysisStatus: 'pending' | 'completed' | 'failed';
  analysisError?: string;
  // Instance methods
  markAsAnalyzed(success: boolean, error?: string): Promise<IRepository>;
}

/**
 * Repository Schema
 * Optimized for repository analysis and storage
 */
const RepositorySchema = new Schema<IRepository>({
  // GitHub specific fields
  githubId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  htmlUrl: {
    type: String,
    required: true
  },
  cloneUrl: {
    type: String,
    required: true
  },
  language: {
    type: String,
    trim: true
  },
  stars: {
    type: Number,
    default: 0
  },
  forks: {
    type: Number,
    default: 0
  },
  watchers: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    required: true
  },
  updatedAt: {
    type: Date,
    required: true
  },
  pushedAt: {
    type: Date
  },
  owner: {
    login: {
      type: String,
      required: true,
      index: true
    },
    id: {
      type: Number,
      required: true
    },
    avatarUrl: {
      type: String,
      required: true
    },
    htmlUrl: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['User', 'Organization']
    }
  },
  topics: [{
    type: String,
    trim: true
  }],
  license: {
    key: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    spdxId: String,
    url: String
  },
  // Embedded file tree - denormalized for read performance
  fileTree: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['file', 'dir']
    },
    path: {
      type: String,
      required: true
    },
    size: Number,
    downloadUrl: String
  }],
  // Analysis tracking
  lastAnalyzed: Date,
  analysisStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  analysisError: String
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'repositories'
});

// Compound indexes for common queries
RepositorySchema.index({ 'owner.login': 1, name: 1 });
RepositorySchema.index({ language: 1, stars: -1 });
RepositorySchema.index({ updatedAt: -1 });
RepositorySchema.index({ analysisStatus: 1, lastAnalyzed: 1 });

// Instance methods
RepositorySchema.methods.markAsAnalyzed = function(success: boolean, error?: string) {
  this.lastAnalyzed = new Date();
  this.analysisStatus = success ? 'completed' : 'failed';
  if (error) {
    this.analysisError = error;
  }
  return this.save();
};

// Static methods
/**
 * Repository Model with static methods
 */
interface IRepositoryModel extends mongoose.Model<IRepository> {
  findByFullName(fullName: string): Promise<IRepository | null>;
  findPopular(limit?: number): Promise<IRepository[]>;
  findRecent(limit?: number): Promise<IRepository[]>;
}

RepositorySchema.statics.findByFullName = function(fullName: string) {
  return this.findOne({ fullName });
};

RepositorySchema.statics.findPopular = function(limit = 10) {
  return this.find({ analysisStatus: 'completed' })
    .sort({ stars: -1 })
    .limit(limit);
};

RepositorySchema.statics.findRecent = function(limit = 10) {
  return this.find({ analysisStatus: 'completed' })
    .sort({ lastAnalyzed: -1 })
    .limit(limit);
};

/**
 * Repository Model
 */
export const Repository = mongoose.model<IRepository, IRepositoryModel>('Repository', RepositorySchema);