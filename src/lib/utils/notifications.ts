import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { settingsStore } from '../stores/settings.svelte';

export async function notify(title: string, body: string, type: 'pomo' | 'flow' = 'pomo') {
    if (type === 'pomo' && !settingsStore.pomoNotificationsEnabled) return;
    if (type === 'flow' && !settingsStore.flowNotificationsEnabled) return;

    try {
        let permission = await isPermissionGranted();
        if (!permission) {
            const permissionResponse = await requestPermission();
            permission = permissionResponse === 'granted';
        }

        if (permission) {
            sendNotification({ title, body });
        }
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
}
