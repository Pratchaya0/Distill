import Dexie, { type EntityTable } from 'dexie';
import type { Recording, Note, PromptTemplate } from '@/types';

interface SettingsRow {
  key: string;
  value: string;
}

class AppDatabase extends Dexie {
  recordings!: EntityTable<Recording, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;
  templates!: EntityTable<PromptTemplate, 'id'>;

  constructor() {
    super('distill');
    this.version(1).stores({
      recordings: '++id, createdAt, isFavorite',
      notes: '++id, recordingId, timestamp',
      settings: 'key',
    });
    // version 2: adds custom templates table
    this.version(2).stores({
      recordings: '++id, createdAt, isFavorite',
      notes: '++id, recordingId, timestamp',
      settings: 'key',
      templates: 'id',
    });
  }
}

export const db = new AppDatabase();

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.settings.get(key);
  return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}
