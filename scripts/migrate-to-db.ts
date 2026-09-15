/**
 * migrate-to-db.ts - Migra dados dos arquivos JSON para o PostgreSQL
 * Execute com: npx tsx scripts/migrate-to-db.ts
 */

import { query, getPool } from '../server/db';
import * as fs from 'fs';
import * as path from 'path';

const TABLES = [
  { name: 'meetings', file: 'meetings.json' },
  { name: 'tasks', file: 'tasks.json' },
  { name: 'notes', file: 'notes.json' },
  { name: 'projects', file: 'projects.json' },
  { name: 'tags', file: 'tags.json' },
  { name: 'events', file: 'events.json' },
  { name: 'emails', file: 'emails.json' },
  { name: 'drive_files', file: 'drive-files.json' },
  { name: 'useful_links', file: 'useful-links.json' },
  { name: 'inbox', file: 'inbox.json' },
  { name: 'activity_logs', file: 'activity-logs.json' },
  { name: 'notifications', file: 'notifications.json' },
  { name: 'chat_messages', file: 'chat-messages.json' },
];

async function migrate() {
  console.log('[Migration] Iniciando migração para PostgreSQL...');

  const dataDir = path.join(process.cwd(), 'server', 'data');

  for (const table of TABLES) {
    const filePath = path.join(dataDir, table.file);

    if (!fs.existsSync(filePath)) {
      console.log(`[Migration] ${table.file} não existe, pulando...`);
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const items = Array.isArray(data) ? data : [];

      if (items.length === 0) {
        console.log(`[Migration] ${table.file} está vazio, pulando...`);
        continue;
      }

      console.log(`[Migration] Migrando ${items.length} itens de ${table.file}...`);

      for (const item of items) {
        await query(
          `INSERT INTO ${table.name} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2`,
          [item.id, JSON.stringify(item)]
        );
      }

      console.log(`[Migration] ✓ ${table.file} migrado com sucesso`);
    } catch (error) {
      console.error(`[Migration] Erro ao migrar ${table.file}:`, error);
    }
  }

  console.log('[Migration] Migração concluída!');

  // Mostra o status
  const pool = getPool();
  const client = await pool.connect();
  try {
    for (const table of TABLES) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`[Migration] ${table.name}: ${result.rows[0].count} registros`);
    }
  } finally {
    client.release();
  }
}

migrate().catch(console.error);
