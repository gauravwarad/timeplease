<script lang="ts">
  import { onMount, tick, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { projectStore } from "./lib/stores/projects.svelte";
  import { settingsStore } from "./lib/stores/settings.svelte";
  import ProjectList from "./components/ProjectList.svelte";
  import AddProject from "./components/AddProject.svelte";
  import TimerDisplay from "./components/TimerDisplay.svelte";
  import Metrics from "./components/Metrics.svelte";
  import HUD from "./components/HUD.svelte";
  import Timeline from "./components/Timeline.svelte";
  import { sessionStore } from "./lib/stores/sessions.svelte";
  import type { Project, Session, DailyStats } from "./lib/types";
  import HonestyModal from "./components/HonestyModal.svelte";
  import { timerStore } from "./lib/stores/timer.svelte";
  import { StorageService } from "./lib/services/storage";
  import { getLocalDateString } from "./lib/utils/date";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

  let isHUD = $state(false);
  let view = $state<"timer" | "projects" | "metrics" | "settings">("timer");

  // Create reactive derived values at component level
  let projects = $derived(projectStore.projects);
  let currentTheme = $derived(settingsStore.theme);

  let unlistenClose: (() => void) | undefined;

  onMount(async () => {
    // Load projects, settings, and sessions
    await Promise.all([
      projectStore.load(),
      settingsStore.load(),
      sessionStore.load(),
    ]);

    // Check if we are running in the HUD window
    if (window.location.hash === "#/hud") {
      isHUD = true;
      document.body.classList.add("hud-window");
    } else {
      // Main window setup: Close HUD when main window is closed
      const win = getCurrentWindow();
      unlistenClose = await win.onCloseRequested(async (event: any) => {
        event.preventDefault();
        try {
          const hud = await WebviewWindow.getByLabel("hud");
          if (hud) {
            await hud.close();
          }
        } catch (e) {
          console.error("Error closing HUD window:", e);
        } finally {
          await win.destroy();
        }
      });
    }
  });

  onDestroy(() => {
    if (unlistenClose) unlistenClose();
  });

  const views = [
    { id: "timer", label: "Timer", icon: "m12 6 4 6-4 6-4-6 4-6Z" },
    { id: "projects", label: "Projects", icon: "M3 7h18M3 12h18M3 17h18" },
    {
      id: "metrics",
      label: "Metrics",
      icon: "M3 3v18h18M7 16V10m4 6V7m4 9v-3m4 3V5",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z",
    },
  ];

  function toggleTheme() {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    settingsStore.setTheme(nextTheme);
  }

  async function handleModalSave(actualMinutes: number, label: string) {
    const completed = timerStore.completedSession;
    if (!completed) return;

    const dateStr = new Date().toISOString();
    const dateDay = getLocalDateString();

    const session: Session = {
      id: crypto.randomUUID(),
      project_id: completed.projectId,
      start_time: new Date(
        Date.now() - completed.elapsedSeconds * 1000,
      ).toISOString(),
      end_time: dateStr,
      elapsed_seconds: completed.elapsedSeconds,
      actual_work_minutes: actualMinutes,
      label: label || "Work Session",
      type: completed.mode as any,
    };

    await sessionStore.addSession(session);

    const allStats = await StorageService.getDailyStats();
    const todayStats = allStats.find((s: DailyStats) => s.date === dateDay);
    const currentCount = todayStats?.work_sessions_completed || 0;
    const currentMins = todayStats?.total_work_minutes || 0;

    await StorageService.updateDailyStats(dateDay, {
      work_sessions_completed: currentCount + 1,
      total_work_minutes: currentMins + actualMinutes,
    });

    timerStore.clearCompletedSession();
  }

  function handleModalCancel() {
    timerStore.clearCompletedSession();
  }
</script>

{#if !isHUD}
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10" /><polyline
            points="12 6 12 12 16 14"
          /></svg
        >
        <span>TimePlease</span>
      </div>

      <nav class="sidebar-nav">
        {#each views as v}
          <button
            class:active={view === v.id}
            onclick={() => (view = v.id as any)}
            title={v.label}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d={v.icon} />
            </svg>
            <span>{v.label}</span>
          </button>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <button class="theme-toggle" onclick={toggleTheme} title="Toggle Theme">
          {#if currentTheme === "dark"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><circle cx="12" cy="12" r="5" /><path
                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              /></svg
            >
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg
            >
          {/if}
        </button>
      </div>
    </aside>

    <main class="main-content">
      {#if view === "timer"}
        <div
          in:fade={{ duration: 200 }}
          class="view-wrapper timer-view scrollable"
        >
          <div class="timer-container p-6">
            <TimerDisplay />
          </div>
          <div class="timeline-container p-6 bg-surface-alt">
            <h3>Today's Timeline</h3>
            <Timeline />
          </div>
        </div>
      {:else if view === "projects"}
        <div in:fade={{ duration: 200 }} class="view-wrapper scrollable p-8">
          <div class="view-header">
            <h2>Your Projects</h2>
            <AddProject />
          </div>
          <ProjectList />
        </div>
      {:else if view === "metrics"}
        <div in:fade={{ duration: 200 }} class="view-wrapper scrollable p-8">
          <Metrics />
        </div>
      {:else if view === "settings"}
        <div in:fade={{ duration: 200 }} class="view-wrapper scrollable p-8">
          <h2>Settings</h2>
          <div class="settings-grid">
            <div class="setting-card">
              <h3>Pomodoro Timer</h3>
              <div class="setting-item">
                <label for="pomo-duration">Focus Duration (min)</label>
                <input
                  id="pomo-duration"
                  type="number"
                  value={settingsStore.pomodoroDuration}
                  onchange={(e) =>
                    settingsStore.setPomodoroDuration(
                      Number(e.currentTarget.value),
                    )}
                />
              </div>
              <div class="setting-item">
                <label for="break-duration">Break Duration (min)</label>
                <input
                  id="break-duration"
                  type="number"
                  value={settingsStore.breakDuration}
                  onchange={(e) =>
                    settingsStore.setBreakDuration(
                      Number(e.currentTarget.value),
                    )}
                />
              </div>
              <div class="setting-item">
                <label for="long-break-duration"
                  >Long Break Duration (min)</label
                >
                <input
                  id="long-break-duration"
                  type="number"
                  value={settingsStore.longBreakDuration}
                  onchange={(e) =>
                    settingsStore.setLongBreakDuration(
                      Number(e.currentTarget.value),
                    )}
                />
              </div>
              <div class="setting-item">
                <label for="pomo-cycle">Sessions before Long Break</label>
                <input
                  id="pomo-cycle"
                  type="number"
                  value={settingsStore.pomodoroSessionsBeforeLongBreak}
                  onchange={(e) =>
                    settingsStore.setPomodoroSessionsBeforeLongBreak(
                      Number(e.currentTarget.value),
                    )}
                />
              </div>
            </div>

            <div class="setting-card">
              <h3>Notifications</h3>
              <div class="setting-item toggle">
                <label for="pomo-notifications">Pomodoro Alerts</label>
                <input
                  id="pomo-notifications"
                  type="checkbox"
                  checked={settingsStore.pomoNotificationsEnabled}
                  onchange={(e) =>
                    settingsStore.setPomoNotificationsEnabled(
                      e.currentTarget.checked,
                    )}
                />
              </div>
              <div class="setting-item toggle">
                <label for="flow-notifications">Flow Milestones</label>
                <input
                  id="flow-notifications"
                  type="checkbox"
                  checked={settingsStore.flowNotificationsEnabled}
                  onchange={(e) =>
                    settingsStore.setFlowNotificationsEnabled(
                      e.currentTarget.checked,
                    )}
                />
              </div>
              <div class="setting-item">
                <label for="flow-interval">Flow Milestone Every (mins)</label>
                <input
                  id="flow-interval"
                  type="number"
                  min="1"
                  value={settingsStore.flowNotificationInterval}
                  onchange={(e) =>
                    settingsStore.setFlowNotificationInterval(
                      Number(e.currentTarget.value),
                    )}
                />
              </div>
            </div>

            <div class="setting-card">
              <h3>Appearance</h3>
              <div class="setting-item">
                <label for="theme-select">Theme</label>
                <select
                  id="theme-select"
                  value={settingsStore.theme}
                  onchange={(e) =>
                    settingsStore.setTheme(e.currentTarget.value as any)}
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </main>
  </div>
{:else}
  <div class="hud-wrapper">
    <HUD />
  </div>
{/if}

{#if timerStore.completedSession}
  <HonestyModal
    elapsedSeconds={timerStore.completedSession.elapsedSeconds}
    onSave={handleModalSave}
    onCancel={handleModalCancel}
  />
{/if}

<style>
  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .sidebar {
    width: 240px;
    background-color: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: 1.5rem 1rem;
    flex-shrink: 0;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
    font-family: var(--font-display);
    margin-bottom: 2.5rem;
    padding: 0 0.5rem;
    color: var(--accent-color);
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1;
  }

  .sidebar-nav button {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-weight: 500;
  }

  .sidebar-nav button:hover {
    background-color: var(--bg-app);
    color: var(--text-main);
  }

  .sidebar-nav button.active {
    background-color: var(--accent-color);
    color: var(--text-inverse);
    box-shadow: var(--shadow-md);
  }

  .sidebar-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: center;
  }

  .theme-toggle {
    padding: 0.5rem;
    border-radius: 50%;
    color: var(--text-muted);
  }

  .theme-toggle:hover {
    background-color: var(--bg-app);
    color: var(--text-main);
  }

  .main-content {
    flex-grow: 1;
    position: relative;
    background-color: var(--bg-app);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .view-wrapper {
    min-height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .scrollable {
    overflow-y: auto;
  }

  .p-6 {
    padding: 1.5rem;
  }
  .p-8 {
    padding: 2rem;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .timer-view {
    display: flex;
    flex-direction: column;
  }

  .timer-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timeline-container {
    background-color: var(--bg-sidebar);
    border-top: 1px solid var(--border-color);
    padding: 1.5rem 2rem;
  }

  .timeline-container h3 {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .setting-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-sm);
  }

  .setting-card h3 {
    font-size: 1.1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .setting-item label {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .hud-wrapper {
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  @media (max-width: 800px) {
    .sidebar {
      width: 80px;
    }
    .sidebar span,
    .logo span {
      display: none;
    }
    .sidebar-nav button {
      justify-content: center;
    }
  }
</style>
