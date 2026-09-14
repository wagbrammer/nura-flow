/**
 * Drive Service - Uses WebDAV or local storage instead of Google Drive API
 * Works with Nextcloud, ownCloud, or local file system
 */

import fs from 'fs';
import path from 'path';

export interface DriveFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  updatedAt?: string;
  path: string;
  url?: string;
}

export interface DriveConfig {
  type: 'local' | 'webdav';
  path?: string; // For local type
  url?: string; // For WebDAV type
  user?: string;
  pass?: string;
}

class DriveService {
  private config: DriveConfig = { type: 'local' };

  /**
   * Initialize drive service
   */
  initialize(config: DriveConfig): void {
    this.config = config;
  }

  /**
   * Check if drive service is configured
   */
  isConfigured(): boolean {
    if (this.config.type === 'local') {
      return !!this.config.path;
    }
    return !!this.config.url;
  }

  /**
   * Get drive status
   */
  getStatus(): { configured: boolean; type: string; path?: string; url?: string } {
    return {
      configured: this.isConfigured(),
      type: this.config.type,
      path: this.config.path,
      url: this.config.url
    };
  }

  /**
   * Get files from local storage
   */
  async getFiles(folderPath: string = '/'): Promise<DriveFile[]> {
    if (this.config.type !== 'local' || !this.config.path) {
      return [];
    }

    try {
      const fullpath = path.join(this.config.path, folderPath);

      if (!fs.existsSync(fullpath)) {
        return [];
      }

      const items: DriveFile[] = [];

      const entries = fs.readdirSync(fullpath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(fullpath, entry.name);
        const stats = fs.statSync(fullPath);

        if (entry.isDirectory()) {
          items.push({
            id: `folder_${entry.name}_${Date.now()}`,
            name: entry.name,
            type: 'folder',
            path: `${folderPath}/${entry.name}`,
            updatedAt: stats.mtime.toISOString()
          });
        } else {
          items.push({
            id: `file_${entry.name}_${Date.now()}`,
            name: entry.name,
            type: 'file',
            size: stats.size,
            mimeType: this.getMimeType(entry.name),
            path: `${folderPath}/${entry.name}`,
            updatedAt: stats.mtime.toISOString()
          });
        }
      }

      return items.sort((a, b) => {
        // Folders first
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error reading local files:', error);
      return [];
    }
  }

  /**
   * Get file content
   */
  async getFileContent(fileId: string): Promise<{ success: boolean; content?: string; error?: string }> {
    if (this.config.type !== 'local' || !this.config.path) {
      return { success: false, error: 'Drive not configured' };
    }

    try {
      const filePath = path.join(this.config.path, fileId);
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: 'File not found or cannot be read' };
    }
  }

  /**
   * Upload file
   */
  async uploadFile(fileName: string, content: string, folderPath: string = '/'): Promise<{ success: boolean; file?: DriveFile }> {
    if (this.config.type !== 'local' || !this.config.path) {
      return { success: false };
    }

    try {
      const fullPath = path.join(this.config.path, folderPath, fileName);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);

      const stats = fs.statSync(fullPath);

      return {
        success: true,
        file: {
          id: `file_${fileName}_${Date.now()}`,
          name: fileName,
          type: 'file',
          size: stats.size,
          mimeType: this.getMimeType(fileName),
          path: `${folderPath}/${fileName}`,
          updatedAt: stats.mtime.toISOString()
        }
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    if (this.config.type !== 'local' || !this.config.path) {
      return { success: false };
    }

    try {
      const fullPath = path.join(this.config.path, fileId);
      fs.unlinkSync(fullPath);
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Get WebDAV files (placeholder)
   */
  async getWebDAVFiles(_folderPath: string = '/'): Promise<DriveFile[]> {
    // Placeholder for WebDAV implementation
    console.log('WebDAV integration placeholder - implement with webdav library');
    return [];
  }

  /**
   * Detect MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.zip': 'application/zip',
      '.json': 'application/json',
      '.xml': 'application/xml'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export const DriveServiceInstance = new DriveService();
export default DriveServiceInstance;
