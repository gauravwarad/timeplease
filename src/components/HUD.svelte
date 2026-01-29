<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { listen } from "@tauri-apps/api/event";
    import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
    import type { TimerStatus, TimerMode } from "../lib/types";

    let timeString = $state("00:00");
    let status = $state<TimerStatus>("IDLE");
    let mode = $state<TimerMode>("FLOW");
    let projectColor = $state("#333"); // Default dark grey
    let isBreak = $state(false);

    let unlisten: () => void;
    let unlistenMoved: () => void;
    const HUD_WINDOW_LABEL = "hud";

    function formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    async function handleMouseDown(e: MouseEvent) {
        // Only trigger drag on left click and not on interactive elements if any were added
        if (e.button === 0) {
            await getCurrentWindow().startDragging();
        }
    }

    async function savePosition() {
        try {
            const win = getCurrentWindow();
            const pos = await win.innerPosition();
            // Only save if it's a valid-looking position
            if (pos.x !== 0 || pos.y !== 0) {
                localStorage.setItem(
                    `window-pos-${HUD_WINDOW_LABEL}`,
                    JSON.stringify({ x: pos.x, y: pos.y }),
                );
            }
        } catch (err) {
            console.error("Failed to save HUD position", err);
        }
    }

    async function restorePosition() {
        try {
            const saved = localStorage.getItem(
                `window-pos-${HUD_WINDOW_LABEL}`,
            );
            if (saved) {
                const { x, y } = JSON.parse(saved);

                // Safety check: if position is extremely far off, ignore it.
                // This helps recover from the previous Physical/Logical mismatch bug.
                if (Math.abs(x) > 10000 || Math.abs(y) > 10000) {
                    console.warn(
                        "Ignoring suspiciously large saved HUD position:",
                        { x, y },
                    );
                    localStorage.removeItem(`window-pos-${HUD_WINDOW_LABEL}`);
                    return;
                }

                const win = getCurrentWindow();
                // Use PhysicalPosition to match what was saved from innerPosition()
                await win.setPosition(new PhysicalPosition(x, y));
            }
        } catch (err) {
            console.warn("Failed to restore HUD position", err);
        }
    }

    onMount(async () => {
        // Restore position immediately
        await restorePosition();

        // Listen for timer updates from the main window
        unlisten = await listen<any>("timer-tick", (event) => {
            const payload = event.payload;
            timeString = formatTime(payload.time);
            status = payload.status;
            mode = payload.mode;
            projectColor = payload.projectColor || "#333";
            isBreak = payload.isBreak;
        });

        // Save position when moved
        unlistenMoved = await getCurrentWindow().onMoved(() => {
            savePosition();
        });
    });

    onDestroy(() => {
        if (unlisten) unlisten();
        if (unlistenMoved) unlistenMoved();
    });
</script>

<!-- 
  We use onmousedown for startDragging() as it's more reliable than data-tauri-drag-region 
  for frameless windows in some environments.
-->
<div
    class="hud-container"
    onmousedown={handleMouseDown}
    role="presentation"
    data-tauri-drag-region
    draggable="false"
    style:--theme-accent={projectColor}
    class:is-break={isBreak}
>
    <div class="hud-content">
        <div class="time-display">
            {timeString}
        </div>
        <div class="mode-indicator">
            {isBreak ? "REST" : mode}
        </div>
    </div>
    <div class="accent-bar" style:background-color={projectColor}></div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: transparent !important;
    }

    .hud-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 15, 20, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        color: white;
        font-family: "Outfit", sans-serif;
        border-radius: 12px;
        user-select: none;
        cursor: move;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-sizing: border-box;
        overflow: hidden;
    }

    .hud-content {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-bottom: 4px;
    }

    .time-display {
        font-size: 1.75rem;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.02em;
        line-height: 1;
    }

    .mode-indicator {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        opacity: 0.6;
        text-transform: uppercase;
        margin-top: 2px;
    }

    .accent-bar {
        height: 4px;
        width: 100%;
        transition: background-color 0.3s ease;
    }

    .is-break .time-display {
        color: #10b981; /* Emerald-500 */
    }
</style>
