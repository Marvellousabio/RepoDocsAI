#!/usr/bin/env node

/**
 * MongoDB Backup Script
 * Creates backups of the repository database
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/repodocsai';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create MongoDB backup using mongodump
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  try {
    console.log(`Creating backup: ${backupPath}`);

    // Parse MongoDB URI to extract connection details
    const url = new URL(MONGODB_URI);
    const dbName = url.pathname.substring(1) || 'repodocsai';

    let command = `mongodump --out="${backupPath}" --db=${dbName}`;

    // Add authentication if present
    if (url.username && url.password) {
      command += ` --username=${url.username} --password=${url.password}`;
    }

    // Add host and port
    const host = url.hostname;
    const port = url.port || '27017';
    command += ` --host=${host} --port=${port}`;

    await execAsync(command);
    console.log('✅ Backup completed successfully');

    // Clean up old backups (keep last 10)
    await cleanupOldBackups();

    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

/**
 * Clean up old backups, keeping only the most recent ones
 */
async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    // Keep only the last 10 backups
    const toDelete = files.slice(10);

    for (const file of toDelete) {
      fs.rmSync(file.path, { recursive: true, force: true });
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

/**
 * List available backups
 */
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          name: file,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());

    console.log('Available backups:');
    files.forEach(backup => {
      console.log(`  ${backup.name} - ${backup.created.toISOString()} (${(backup.size / 1024 / 1024).toFixed(2)} MB)`);
    });

    return files;
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return [];
  }
}

/**
 * Restore from backup
 */
async function restoreBackup(backupPath: string) {
  try {
    console.log(`Restoring from backup: ${backupPath}`);

    const url = new URL(MONGODB_URI);
    const dbName = url.pathname.substring(1) || 'repodocsai';

    let command = `mongorestore "${backupPath}/${dbName}" --db=${dbName}`;

    if (url.username && url.password) {
      command += ` --username=${url.username} --password=${url.password}`;
    }

    const host = url.hostname;
    const port = url.port || '27017';
    command += ` --host=${host} --port=${port}`;

    // Drop existing database before restore
    command += ' --drop';

    await execAsync(command);
    console.log('✅ Restore completed successfully');
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'backup':
    createBackup().catch(console.error);
    break;
  case 'list':
    listBackups();
    break;
  case 'restore':
    const backupName = process.argv[3];
    if (!backupName) {
      console.error('Please specify backup name: npm run backup-restore <backup-name>');
      process.exit(1);
    }
    const backupPath = path.join(BACKUP_DIR, backupName);
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup not found: ${backupName}`);
      process.exit(1);
    }
    restoreBackup(backupPath).catch(console.error);
    break;
  default:
    console.log('Usage:');
    console.log('  npm run backup-create    - Create a new backup');
    console.log('  npm run backup-list      - List available backups');
    console.log('  npm run backup-restore <name> - Restore from backup');
    break;
}