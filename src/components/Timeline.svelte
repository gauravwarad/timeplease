<script lang="ts">
    import { onMount, tick } from "svelte";
    import { fade } from "svelte/transition";
    import type { Session, Project } from "../lib/types";
    import { sessionStore } from "../lib/stores/sessions.svelte";
    import { projectStore } from "../lib/stores/projects.svelte";

    import { getLocalDateString, getLocalDateFromISO } from "../lib/utils/date";

    let sessions = $derived(sessionStore.sessions);
    let projects = $derived(projectStore.projects);

    const projectMap = $derived(
        new Map<string, Project>(projects.map((p: Project) => [p.id, p])),
    );

    // Get today's date in local YYYY-MM-DD
    const todayStr = getLocalDateString();

    const todaySessions = $derived(
        sessions
            .filter(
                (s: Session) => getLocalDateFromISO(s.start_time) === todayStr,
            )
            .sort((a: Session, b: Session) =>
                a.start_time.localeCompare(b.start_time),
            )
            .reverse(), // Show newest first in timeline
    );

    onMount(async () => {
        // Data is loaded in App.svelte
    });

    function formatTime(isoString: string) {
        return new Date(isoString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatDuration(seconds: number) {
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    }
</script>

<div class="timeline-wrapper">
    {#if todaySessions.length === 0}
        <div class="empty-state">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                /></svg
            >
            <p>Your timeline is empty. Start a session to see progress!</p>
        </div>
    {:else}
        <div class="session-feed">
            {#each todaySessions as session (session.id)}
                {@const project = projectMap.get(session.project_id)}
                <div class="feed-item" in:fade>
                    <div class="time-col">
                        <span class="time-start"
                            >{formatTime(session.start_time)}</span
                        >
                    </div>

                    <div class="marker-col">
                        <div
                            class="marker-dot"
                            style:background-color={project?.color}
                        ></div>
                        <div class="marker-line"></div>
                    </div>

                    <div class="content-col">
                        <div class="session-card">
                            <div class="card-header">
                                <span
                                    class="project-name"
                                    style:color={project?.color}
                                    >{project?.name || "Unknown Project"}</span
                                >
                                <span class="duration-badge"
                                    >{formatDuration(
                                        session.elapsed_seconds,
                                    )}</span
                                >
                            </div>
                            <p class="session-label">{session.label}</p>
                            <div class="card-footer">
                                <span class="efficiency-tag">
                                    {(
                                        (session.actual_work_minutes /
                                            (session.elapsed_seconds / 60)) *
                                        100
                                    ).toFixed(0)}% focus
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .timeline-wrapper {
        width: 100%;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        text-align: center;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .session-feed {
        display: flex;
        flex-direction: column;
    }

    .feed-item {
        display: flex;
        gap: 1.5rem;
    }

    .feed-item:last-child .marker-line {
        display: none;
    }

    .time-col {
        width: 60px;
        text-align: right;
        padding-top: 0.25rem;
    }

    .time-start {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
    }

    .marker-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 12px;
    }

    .marker-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: var(--border-color);
        z-index: 1;
        border: 2px solid var(--bg-app);
        margin-top: 0.5rem;
    }

    .marker-line {
        width: 2px;
        flex-grow: 1;
        background-color: var(--border-color);
        margin: -4px 0;
    }

    .content-col {
        flex-grow: 1;
        padding-bottom: 2rem;
    }

    .session-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1rem 1.25rem;
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s ease;
    }

    .session-card:hover {
        transform: translateX(4px);
        box-shadow: var(--shadow-md);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .project-name {
        font-size: 0.85rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .duration-badge {
        font-size: 0.75rem;
        font-weight: 700;
        background: var(--bg-input);
        color: var(--text-muted);
        padding: 0.15rem 0.5rem;
        border-radius: 1rem;
    }

    .session-label {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-main);
        margin: 0 0 0.75rem 0;
    }

    .efficiency-tag {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .efficiency-tag::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--accent-color);
    }
</style>
