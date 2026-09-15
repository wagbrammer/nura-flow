/**
 * data-store-db.ts - Data stores usando PostgreSQL (Supabase compatível)
 */

import { query } from './db';

interface DataStore<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(item: T): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T | undefined>;
  delete(id: string): Promise<boolean>;
}

function createDbStore<T extends { id: string }>(table: string): DataStore<T> {
  return {
    async getAll(): Promise<T[]> {
      const rows = await query<{ data: T }>(`SELECT data FROM ${table}`);
      return rows.map(row => row.data);
    },

    async getById(id: string): Promise<T | undefined> {
      const rows = await query<{ data: T }>(`SELECT data FROM ${table} WHERE id = $1`, [id]);
      return rows.length > 0 ? rows[0].data : undefined;
    },

    async create(item: T): Promise<T> {
      await query(
        `INSERT INTO ${table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
        [item.id, JSON.stringify(item)]
      );
      return item;
    },

    async update(id: string, updates: Partial<T>): Promise<T | undefined> {
      const existing = await this.getById(id);
      if (!existing) return undefined;

      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      await query(
        `UPDATE ${table} SET data = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, JSON.stringify(updated)]
      );
      return updated;
    },

    async delete(id: string): Promise<boolean> {
      const result = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
      return result.length > 0;
    }
  };
}

// Export all stores
export const meetingsStore = createDbStore<any>('meetings');
export const tasksStore = createDbStore<any>('tasks');
export const notesStore = createDbStore<any>('notes');
export const projectsStore = createDbStore<any>('projects');
export const tagsStore = createDbStore<any>('tags');
export const eventsStore = createDbStore<any>('events');
export const emailsStore = createDbStore<any>('emails');
export const driveFilesStore = createDbStore<any>('drive_files');
export const usefulLinksStore = createDbStore<any>('useful_links');
export const inboxStore = createDbStore<any>('inbox');
export const activityLogsStore = createDbStore<any>('activity_logs');
export const notificationsStore = createDbStore<any>('notifications');
export const chatMessagesStore = createDbStore<any>('chat_messages');
