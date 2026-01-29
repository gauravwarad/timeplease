<script lang="ts">
    import { timerStore } from "../lib/stores/timer.svelte";
    import { settingsStore } from "../lib/stores/settings.svelte";
    import { projectStore } from "../lib/stores/projects.svelte";
    import { StorageService } from "../lib/services/storage";
    import { type Session, type DailyStats, type Project } from "../lib/types";
    import { sessionStore } from "../lib/stores/sessions.svelte";
    import { getLocalDateString } from "../lib/utils/date";
    import HonestyModal from "./HonestyModal.svelte";

    let projects = $derived(projectStore.projects);
    let activeProjects = $derived(projects.filter((p) => !p.is_archived));

    function formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    function handleStart() {
        timerStore.start();
    }

    function handlePause() {
        timerStore.pause();
    }

    async function handleStop() {
        const project = timerStore.selectedProject;
        if (!project) return;

        const result = timerStore.stop();

        if (result.isBreak) {
            const date = getLocalDateString();
            const allStats = await StorageService.getDailyStats();
            const todayStats = allStats.find(
                (s: DailyStats) => s.date === date,
            );
            const currentBreaks = todayStats?.breaks_taken || 0;

            await StorageService.updateDailyStats(date, {
                breaks_taken: currentBreaks + 1,
            });
            return;
        }

        if (result.elapsedSeconds > 0) {
            timerStore.showHonestyModal(
                result.elapsedSeconds,
                result.mode,
                project.id,
            );
        }
    }

    function toggleMode() {
        timerStore.setMode(timerStore.mode === "FLOW" ? "POMO" : "FLOW");
    }

    async function toggleHUD() {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const hud = await WebviewWindow.getByLabel("hud");
        if (hud) {
            const isVisible = await hud.isVisible();
            if (isVisible) await hud.hide();
            else {
                await hud.show();
                timerStore.sync();
            }
        }
    }
</script>

<div
    class="timer-view-container"
    style:--theme-color={timerStore.status === "IDLE"
        ? "var(--color-idle)"
        : timerStore.isBreak
          ? "var(--color-break)"
          : timerStore.mode === "FLOW"
            ? "var(--color-flow)"
            : "var(--color-pomo)"}
>
    <div class="timer-card animate-fade-in">
        <div class="header">
            <div class="mode-info">
                <button class="mode-badge" onclick={toggleMode}>
                    {timerStore.mode === "POMO" ? "Pomodoro" : "Free Flow"}
                    <span class="badge-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path d="m7 15 5 5 5-5" /><path
                                d="m7 9 5-5 5 5"
                            /></svg
                        >
                    </span>
                </button>
                {#if timerStore.mode === "POMO"}
                    <span class="cycle-pill"
                        >Session {timerStore.pomodoroCycle}</span
                    >
                {/if}
            </div>

            <button
                class="icon-btn"
                onclick={toggleHUD}
                title="Toggle Mini HUD"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><rect width="18" height="18" x="3" y="3" rx="2" /><path
                        d="M12 8v8"
                    /><path d="M8 12h8" /></svg
                >
            </button>
        </div>

        <div class="project-selector">
            {#if timerStore.status === "IDLE"}
                <select
                    value={timerStore.selectedProject?.id || ""}
                    onchange={(e) => {
                        const project = activeProjects.find(
                            (p) => p.id === e.currentTarget.value,
                        );
                        timerStore.setProject(project || null);
                    }}
                >
                    <option value="" disabled selected
                        >Select Current Project</option
                    >
                    {#each activeProjects as project}
                        <option value={project.id}>{project.name}</option>
                    {/each}
                </select>
            {:else}
                <div
                    class="active-project"
                    style:border-color={timerStore.selectedProject?.color}
                >
                    <span
                        class="dot"
                        style:background-color={timerStore.selectedProject
                            ?.color}
                    ></span>
                    {timerStore.selectedProject?.name}
                </div>
            {/if}
        </div>

        <div
            class="time-display"
            class:pulse={timerStore.status === "RUNNING" ||
                timerStore.status === "BREAK"}
        >
            {formatTime(timerStore.time)}
            {#if timerStore.isBreak}
                <div class="break-tag">BREAK</div>
            {/if}
        </div>

        <div class="controls">
            {#if timerStore.status === "RUNNING" || timerStore.status === "BREAK"}
                <button class="btn btn-pause" onclick={handlePause}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        ><rect x="6" y="4" width="4" height="16" /><rect
                            x="14"
                            y="4"
                            width="4"
                            height="16"
                        /></svg
                    >
                    Pause
                </button>
            {:else}
                <button
                    class="btn btn-start"
                    onclick={handleStart}
                    disabled={!timerStore.selectedProject}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        ><polygon points="5 3 19 12 5 21 5 3" /></svg
                    >
                    Start
                </button>
            {/if}

            <button
                class="btn btn-stop"
                onclick={handleStop}
                disabled={timerStore.status === "IDLE" && timerStore.time === 0}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    ><rect x="3" y="3" width="18" height="18" rx="2" /></svg
                >
                Stop
            </button>
        </div>
    </div>
</div>

<style>
    .timer-view-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .timer-card {
        background: var(--bg-card);
        width: 100%;
        max-width: 440px;
        padding: 3rem;
        border-radius: 2rem;
        box-shadow:
            0 20px 25px -5px rgb(0 0 0 / 0.1),
            0 8px 10px -6px rgb(0 0 0 / 0.1),
            inset 0 0 0 2px var(--theme-color);
        border: 1px solid var(--border-color);
        text-align: center;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .mode-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .mode-badge {
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        padding: 0.4rem 0.8rem;
        border-radius: 2rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-main);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .badge-icon {
        color: var(--text-muted);
    }

    .cycle-pill {
        background: var(--theme-color);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 2rem;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .icon-btn {
        color: var(--text-muted);
        padding: 0.5rem;
        border-radius: 50%;
    }

    .icon-btn:hover {
        background: var(--bg-input);
        color: var(--text-main);
    }

    .project-selector {
        margin-bottom: 2.5rem;
    }

    .project-selector select {
        width: 100%;
        text-align: center;
        appearance: none;
        padding: 0.75rem 1rem;
        font-weight: 500;
        cursor: pointer;
    }

    .active-project {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        font-size: 1.1rem;
        color: var(--text-main);
        padding: 0.5rem 1.25rem;
        border-radius: 1rem;
        background: var(--bg-input);
        border: 2px solid transparent;
    }

    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }

    .time-display {
        font-size: 6.5rem;
        font-weight: 800;
        font-family: var(--font-display);
        font-variant-numeric: tabular-nums;
        color: var(--text-main);
        margin-bottom: 3rem;
        line-height: 1;
        position: relative;
    }

    .pulse {
        animation: subtle-pulse 2s infinite ease-in-out;
    }

    @keyframes subtle-pulse {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.02);
        }
    }

    .break-tag {
        position: absolute;
        top: -1.5rem;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-break);
        color: white;
        padding: 0.25rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.9rem;
        font-weight: 800;
        letter-spacing: 0.1em;
    }

    .controls {
        display: flex;
        gap: 1.25rem;
        justify-content: center;
    }

    .btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        font-size: 1.1rem;
        font-weight: 700;
        box-shadow: var(--shadow-md);
    }

    .btn:disabled {
        opacity: 0.4;
        filter: grayscale(1);
    }

    .btn-start {
        background: var(--theme-color);
        color: white;
    }

    .btn-pause {
        background: var(--bg-input);
        color: var(--text-main);
    }

    .btn-stop {
        background: #ef4444;
        color: white;
    }
</style>
