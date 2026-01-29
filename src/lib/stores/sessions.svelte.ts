import { StorageService } from "../services/storage";
import type { Session } from "../types";

function createSessionStore() {
    let sessions = $state<Session[]>([]);
    let isLoading = $state(false);

    async function load() {
        isLoading = true;
        try {
            sessions = await StorageService.getSessions();
        } finally {
            isLoading = false;
        }
    }

    async function addSession(session: Session) {
        await StorageService.saveSession(session);
        sessions = [session, ...sessions];
    }

    return {
        get sessions() { return sessions; },
        get isLoading() { return isLoading; },
        load,
        addSession
    };
}

export const sessionStore = createSessionStore();
