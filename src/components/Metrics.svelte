<script lang="ts">
    import { onMount } from "svelte";
    import { sessionStore } from "../lib/stores/sessions.svelte";
    import { projectStore } from "../lib/stores/projects.svelte";
    import {
        groupSessionsByDayAndProject,
        groupSessionsByMonthAndWeek,
        type DayStats,
        type MonthStats,
    } from "../lib/utils/metrics";
    import Timeline from "./Timeline.svelte";

    let sessions = $derived(sessionStore.sessions);
    let projects = $derived(projectStore.projects);

    let stats = $derived(groupSessionsByDayAndProject(sessions, projects));

    let monthStats = $derived(groupSessionsByMonthAndWeek(sessions, projects));

    let activeTab = $state("daily"); // "daily" or "worklog"

    function formatEfficiency(eff: number) {
        return Math.round(eff) + "%";
    }

    function getEfficiencyLevel(eff: number) {
        if (eff >= 90) return "high";
        if (eff >= 75) return "medium";
        return "low";
    }

    function formatDuration(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }
</script>

<div class="metrics-view">
    <header class="view-header">
        <div class="title-row">
            <h2>Performance Metrics</h2>
            <div class="tabs">
                <button
                    class="tab-btn"
                    class:active={activeTab === "daily"}
                    onclick={() => (activeTab = "daily")}
                >
                    Daily
                </button>
                <button
                    class="tab-btn"
                    class:active={activeTab === "worklog"}
                    onclick={() => (activeTab = "worklog")}
                >
                    Worklog
                </button>
            </div>
        </div>
    </header>

    {#if activeTab === "daily"}
        <div class="metrics-grid">
            {#each stats as day}
                <div class="day-card animate-fade-in">
                    <div class="day-header">
                        <div class="date-info">
                            <span class="day-name"
                                >{new Date(day.date).toLocaleDateString(
                                    undefined,
                                    {
                                        weekday: "short",
                                    },
                                )}</span
                            >
                            <span class="full-date">{day.date}</span>
                        </div>
                        <div
                            class="efficiency-ring {getEfficiencyLevel(
                                day.efficiency,
                            )}"
                        >
                            <span class="eff-value"
                                >{formatEfficiency(day.efficiency)}</span
                            >
                            <span class="eff-label">Focus</span>
                        </div>
                    </div>

                    <div class="project-list">
                        {#each day.projects as p}
                            <div class="project-pill">
                                <span
                                    class="project-dot"
                                    style:background-color={p.project_color}
                                ></span>
                                <span class="project-name"
                                    >{p.project_name}</span
                                >
                                <span class="project-time"
                                    >{p.actual_work_minutes}m</span
                                >
                            </div>
                        {/each}
                    </div>

                    <div class="day-footer">
                        <span class="total-label">Daily Deep Work</span>
                        <span class="total-value"
                            >{day.total_actual_work_minutes}m</span
                        >
                    </div>
                </div>
            {/each}
        </div>

        <section class="timeline-section">
            <h3>Recent Activity</h3>
            <Timeline />
        </section>
    {:else}
        <div class="worklog-view animate-fade-in">
            {#each monthStats as month}
                <div class="month-section">
                    <header class="month-header">
                        <div class="month-title-group">
                            <h3 class="month-name">{month.monthName}</h3>
                            <div class="month-stats">
                                <span class="stat-item"
                                    >Days worked: <strong
                                        >{month.days_worked}</strong
                                    ></span
                                >
                                <span class="stat-item"
                                    >Total time: <strong
                                        >{formatDuration(
                                            month.total_actual_work_minutes,
                                        )}</strong
                                    ></span
                                >
                            </div>
                        </div>
                    </header>

                    <div class="weeks-container">
                        {#each month.weeks as week}
                            <div class="week-group">
                                <div class="week-header">
                                    <span class="week-label"
                                        >Week {week.weekNumber}</span
                                    >
                                    <span class="week-total"
                                        >{formatDuration(
                                            week.total_actual_work_minutes,
                                        )}</span
                                    >
                                </div>
                                <div class="week-days">
                                    <table class="worklog-table">
                                        <thead>
                                            <tr>
                                                <th>Day</th>
                                                <th>Worked</th>
                                                <th>Focus</th>
                                                <th>Projects</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each week.days as day}
                                                <tr>
                                                    <td class="td-date">
                                                        <span class="day-short"
                                                            >{new Date(
                                                                day.date,
                                                            ).toLocaleDateString(
                                                                undefined,
                                                                {
                                                                    weekday:
                                                                        "short",
                                                                },
                                                            )}</span
                                                        >
                                                        <span class="date-num"
                                                            >{new Date(
                                                                day.date,
                                                            ).getDate()}.</span
                                                        >
                                                    </td>
                                                    <td class="td-worked"
                                                        >{formatDuration(
                                                            day.total_actual_work_minutes,
                                                        )}</td
                                                    >
                                                    <td class="td-focus">
                                                        <div
                                                            class="focus-bar-bg"
                                                        >
                                                            <div
                                                                class="focus-bar-fill {getEfficiencyLevel(
                                                                    day.efficiency,
                                                                )}"
                                                                style="width: {day.efficiency}%"
                                                            ></div>
                                                        </div>
                                                        <span class="focus-text"
                                                            >{formatEfficiency(
                                                                day.efficiency,
                                                            )}</span
                                                        >
                                                    </td>
                                                    <td class="td-projects">
                                                        <div
                                                            class="mini-project-dots"
                                                        >
                                                            {#each day.projects as p}
                                                                <span
                                                                    class="mini-dot"
                                                                    title={p.project_name}
                                                                    style:background-color={p.project_color}
                                                                ></span>
                                                            {/each}
                                                        </div>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .metrics-view {
        width: 100%;
        color: var(--text-main);
    }

    .view-header {
        margin-bottom: 2rem;
    }

    .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .tabs {
        display: flex;
        background: var(--bg-sidebar);
        padding: 4px;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
    }

    .tab-btn {
        padding: 0.5rem 1.25rem;
        border-radius: calc(var(--radius-lg) - 2px);
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .tab-btn.active {
        background: var(--bg-card);
        color: var(--accent-color);
        box-shadow: var(--shadow-sm);
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
    }

    .day-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .day-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .date-info {
        display: flex;
        flex-direction: column;
    }

    .day-name {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-main);
    }

    .full-date {
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    .efficiency-ring {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: 4px solid var(--border-color);
    }

    .efficiency-ring.high {
        border-color: var(--color-break);
        color: var(--color-break);
    }
    .efficiency-ring.medium {
        border-color: #f59e0b;
        color: #f59e0b;
    }
    .efficiency-ring.low {
        border-color: var(--color-pomo);
        color: var(--color-pomo);
    }

    .eff-value {
        font-size: 1rem;
        font-weight: 800;
        line-height: 1;
    }

    .eff-label {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .project-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .project-pill {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--bg-app);
        padding: 0.35rem 0.75rem;
        border-radius: 2rem;
        font-size: 0.85rem;
        border: 1px solid var(--border-color);
    }

    .project-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .project-name {
        font-weight: 600;
        color: var(--text-main);
    }

    .project-time {
        color: var(--text-muted);
        font-weight: 500;
    }

    .day-footer {
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .total-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
    }

    .total-value {
        font-size: 1.1rem;
        font-weight: 800;
        color: var(--accent-color);
    }

    .timeline-section {
        background: var(--bg-sidebar);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-xl);
        padding: 2rem;
    }

    .timeline-section h3 {
        margin-bottom: 2rem;
    }

    /* Worklog Styles */
    .worklog-view {
        display: flex;
        flex-direction: column;
        gap: 3rem;
    }

    .month-header {
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .month-name {
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
    }

    .month-stats {
        display: flex;
        justify-content: center;
        gap: 2rem;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .weeks-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .week-group {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .week-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0.5rem;
    }

    .week-label {
        font-weight: 700;
        color: var(--text-muted);
        font-size: 0.9rem;
    }

    .week-total {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    .worklog-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }

    .worklog-table th {
        text-align: left;
        padding: 0.5rem;
        color: var(--text-muted);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.05em;
    }

    .worklog-table td {
        padding: 0.75rem 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .td-date {
        display: flex;
        gap: 0.5rem;
        align-items: baseline;
    }

    .day-short {
        color: var(--text-muted);
        font-weight: 500;
        width: 30px;
    }

    .date-num {
        font-weight: 700;
    }

    .td-worked {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    .td-focus {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .focus-bar-bg {
        width: 40px;
        height: 6px;
        background: var(--bg-input);
        border-radius: 3px;
        overflow: hidden;
    }

    .focus-bar-fill {
        height: 100%;
        border-radius: 3px;
    }

    .focus-bar-fill.high {
        background: var(--color-break);
    }
    .focus-bar-fill.medium {
        background: #f59e0b;
    }
    .focus-bar-fill.low {
        background: var(--color-pomo);
    }

    .focus-text {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        width: 32px;
    }

    .mini-project-dots {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
    }

    .mini-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .animate-fade-in {
        animation: fadeIn 0.4s ease forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
