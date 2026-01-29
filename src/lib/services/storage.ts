import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { Project } from '../types';

const FILE_NAME = 'projects.json';
const SETTINGS_FILE_NAME = 'settings.json';
const SESSIONS_FILE_NAME = 'sessions.json';
const DAILY_STATS_FILE_NAME = 'daily_stats.json';

export class StorageService {
    /**
     * Ensures the data directory exists.
     * In Tauri v2 with 'fs:allow-appdata-recursive', we write to the AppData dir.
     * We must ensure the directory structure exists before writing a file.
     */
    static async init() {
        try {
            // Use recursive: true to ensure parent structure (com.timeplease.app) is created
            await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true });
            console.log('StorageService initialized. AppData directory verified/created.');
        } catch (e) {
            console.error('Failed to initialize StorageService/create directory:', e);
        }
    }

    static async saveProjects(projects: Project[]): Promise<void> {
        try {
            await this.init(); // Always check/ensure dir exists before saving
            const contents = JSON.stringify(projects, null, 2);
            await writeTextFile(FILE_NAME, contents, { baseDir: BaseDirectory.AppData });
            console.log(`Saved ${projects.length} projects successfully.`);
        } catch (e) {
            console.error('Failed to save projects:', e);
            throw e;
        }
    }

    static async loadProjects(): Promise<Project[]> {
        try {
            // First ensure the directory exists, otherwise 'exists' checks might fail or be weird?
            // Actually 'exists' on a non-existent folder for the file should just return false.
            const fileExists = await exists(FILE_NAME, { baseDir: BaseDirectory.AppData });
            if (!fileExists) {
                console.log('projects.json not found. Returning empty list.');
                return [];
            }

            const contents = await readTextFile(FILE_NAME, { baseDir: BaseDirectory.AppData });
            const projects = JSON.parse(contents) as Project[];
            console.log(`Loaded ${projects.length} projects.`);
            return projects;
        } catch (e) {
            console.error('Failed to load projects:', e);
            return [];
        }
    }

    static async saveSettings(settings: any): Promise<void> {
        try {
            await this.init();
            const contents = JSON.stringify(settings, null, 2);
            await writeTextFile(SETTINGS_FILE_NAME, contents, { baseDir: BaseDirectory.AppData });
            console.log(`Saved settings successfully.`);
        } catch (e) {
            console.error('Failed to save settings:', e);
            throw e;
        }
    }


    static async loadSettings(): Promise<any | null> {
        try {
            const fileExists = await exists(SETTINGS_FILE_NAME, { baseDir: BaseDirectory.AppData });
            if (!fileExists) {
                console.log('settings.json not found. Using defaults.');
                return null;
            }

            const contents = await readTextFile(SETTINGS_FILE_NAME, { baseDir: BaseDirectory.AppData });
            const settings = JSON.parse(contents);
            console.log(`Loaded settings.`);
            return settings;
        } catch (e) {
            console.error('Failed to load settings:', e);
            return null;
        }
    }

    static async getSessions(): Promise<any[]> {
        try {
            const fileExists = await exists(SESSIONS_FILE_NAME, { baseDir: BaseDirectory.AppData });
            if (!fileExists) return [];
            const contents = await readTextFile(SESSIONS_FILE_NAME, { baseDir: BaseDirectory.AppData });
            return JSON.parse(contents);
        } catch (e) {
            console.error('Failed to load sessions:', e);
            return [];
        }
    }

    static async saveSession(session: any): Promise<void> {
        try {
            await this.init();
            const sessions = await this.getSessions();
            sessions.push(session);
            await writeTextFile(SESSIONS_FILE_NAME, JSON.stringify(sessions, null, 2), { baseDir: BaseDirectory.AppData });
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    }

    static async getDailyStats(): Promise<any[]> {
        try {
            const fileExists = await exists(DAILY_STATS_FILE_NAME, { baseDir: BaseDirectory.AppData });
            if (!fileExists) return [];
            const contents = await readTextFile(DAILY_STATS_FILE_NAME, { baseDir: BaseDirectory.AppData });
            return JSON.parse(contents);
        } catch (e) {
            console.error('Failed to load daily stats:', e);
            return [];
        }
    }

    static async updateDailyStats(date: string, updates: Partial<any>): Promise<void> {
        try {
            await this.init();
            const allStats = await this.getDailyStats();
            const index = allStats.findIndex((s: any) => s.date === date);

            if (index >= 0) {
                allStats[index] = { ...allStats[index], ...updates };
            } else {
                allStats.push({
                    date,
                    breaks_taken: 0,
                    work_sessions_completed: 0,
                    total_work_minutes: 0,
                    ...updates
                });
            }

            await writeTextFile(DAILY_STATS_FILE_NAME, JSON.stringify(allStats, null, 2), { baseDir: BaseDirectory.AppData });
        } catch (e) {
            console.error('Failed to update daily stats:', e);
        }
    }
}
