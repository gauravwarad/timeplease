
import { StorageService } from '../services/storage';
import type { Settings } from '../types';

function createSettingsStore() {
    let settings = $state<Settings>({
        pomodoroDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        pomodoroSessionsBeforeLongBreak: 4,
        theme: 'system',
        pomoNotificationsEnabled: true,
        flowNotificationsEnabled: true,
        flowNotificationInterval: 30
    });

    return {
        get pomodoroDuration() { return settings.pomodoroDuration; },
        get breakDuration() { return settings.breakDuration; },
        get longBreakDuration() { return settings.longBreakDuration; },
        get pomodoroSessionsBeforeLongBreak() { return settings.pomodoroSessionsBeforeLongBreak; },
        get theme() { return settings.theme || 'system'; },
        get pomoNotificationsEnabled() { return settings.pomoNotificationsEnabled; },
        get flowNotificationsEnabled() { return settings.flowNotificationsEnabled; },
        get flowNotificationInterval() { return settings.flowNotificationInterval; },

        setPomodoroDuration(duration: number) {
            settings.pomodoroDuration = duration;
            StorageService.saveSettings(settings);
        },
        setBreakDuration(duration: number) {
            settings.breakDuration = duration;
            StorageService.saveSettings(settings);
        },
        setLongBreakDuration(duration: number) {
            settings.longBreakDuration = duration;
            StorageService.saveSettings(settings);
        },
        setPomodoroSessionsBeforeLongBreak(count: number) {
            settings.pomodoroSessionsBeforeLongBreak = count;
            StorageService.saveSettings(settings);
        },
        setTheme(theme: 'light' | 'dark' | 'system') {
            settings.theme = theme;
            StorageService.saveSettings(settings);
            // Apply theme immediately
            if (typeof document !== 'undefined') {
                document.documentElement.setAttribute('data-theme', theme);
            }
        },
        setPomoNotificationsEnabled(enabled: boolean) {
            settings.pomoNotificationsEnabled = enabled;
            StorageService.saveSettings(settings);
        },
        setFlowNotificationsEnabled(enabled: boolean) {
            settings.flowNotificationsEnabled = enabled;
            StorageService.saveSettings(settings);
        },
        setFlowNotificationInterval(interval: number) {
            settings.flowNotificationInterval = interval;
            StorageService.saveSettings(settings);
        },

        async load() {
            const loadedSettings = await StorageService.loadSettings();
            if (loadedSettings) {
                // Migration/Defaults
                settings = { ...settings, ...loadedSettings };

                // If old notificationsEnabled exists, migrate it to the new ones
                if ((loadedSettings as any).notificationsEnabled !== undefined) {
                    const oldVal = (loadedSettings as any).notificationsEnabled;
                    if (loadedSettings.pomoNotificationsEnabled === undefined) {
                        settings.pomoNotificationsEnabled = oldVal;
                    }
                    if (loadedSettings.flowNotificationsEnabled === undefined) {
                        settings.flowNotificationsEnabled = oldVal;
                    }
                }

                if (settings.pomoNotificationsEnabled === undefined) settings.pomoNotificationsEnabled = true;
                if (settings.flowNotificationsEnabled === undefined) settings.flowNotificationsEnabled = true;
                if (settings.flowNotificationInterval === undefined) settings.flowNotificationInterval = 30;
            }
            if (typeof document !== 'undefined') {
                document.documentElement.setAttribute('data-theme', settings.theme || 'system');
            }
        }
    };
}

export const settingsStore = createSettingsStore();
