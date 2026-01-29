<script lang="ts">
  import { projectStore } from "../lib/stores/projects.svelte";
  import { timerStore } from "../lib/stores/timer.svelte";
  import type { Project } from "../lib/types";
  import EditProjectModal from "./EditProjectModal.svelte";

  let activeMenuId = $state<string | null>(null);
  let projectToEdit = $state<Project | null>(null);
  let showArchived = $state(false);

  const activeProjects = $derived(
    projectStore.projects.filter((p) => !p.is_archived),
  );

  const archivedProjects = $derived(
    projectStore.projects.filter((p) => p.is_archived),
  );

  function handleSelect(project: Project) {
    if (timerStore.selectedProject?.id === project.id) {
      if (timerStore.status === "IDLE") {
        timerStore.setProject(null);
      }
    } else {
      timerStore.setProject(project);
    }
  }

  function toggleMenu(e: Event, id: string) {
    e.stopPropagation();
    activeMenuId = activeMenuId === id ? null : id;
  }

  function handleEdit(e: Event, project: Project) {
    e.stopPropagation();
    projectToEdit = { ...project };
    activeMenuId = null;
  }

  function handleArchive(e: Event, id: string) {
    e.stopPropagation();
    if (timerStore.selectedProject?.id === id && timerStore.status !== "IDLE") {
      alert("Cannot archive the active project while the timer is running.");
      activeMenuId = null;
      return;
    }
    projectStore.archiveProject(id);
    if (timerStore.selectedProject?.id === id) {
      timerStore.setProject(null);
    }
    activeMenuId = null;
  }

  function handleUnarchive(e: Event, id: string) {
    e.stopPropagation();
    projectStore.unarchiveProject(id);
    activeMenuId = null;
  }

  function handleDelete(e: Event, id: string) {
    e.stopPropagation();
    if (timerStore.selectedProject?.id === id && timerStore.status !== "IDLE") {
      alert("Cannot delete the active project while the timer is running.");
      activeMenuId = null;
      return;
    }
    if (
      confirm(
        "Are you sure you want to delete this project? Sessions will remain but the link will be lost.",
      )
    ) {
      projectStore.deleteProject(id);
      if (timerStore.selectedProject?.id === id) {
        timerStore.setProject(null);
      }
    }
    activeMenuId = null;
  }

  function handleOutsideClick() {
    activeMenuId = null;
  }
</script>

<svelte:window onclick={handleOutsideClick} />

<div class="projects-container">
  <div class="projects-header">
    <h2>Projects</h2>
    {#if archivedProjects.length > 0}
      <button
        class="toggle-archived-btn"
        class:active={showArchived}
        onclick={() => (showArchived = !showArchived)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
            points="9 22 9 12 15 12 15 22"
          /></svg
        >
        {showArchived ? "Show Active" : `Archived (${archivedProjects.length})`}
      </button>
    {/if}
  </div>

  {#if showArchived}
    <div class="archived-section animate-fade-in">
      <div class="section-title">
        <h3>Archived Projects</h3>
        <p>
          These projects are hidden from the timer but still visible in metrics.
        </p>
      </div>

      {#if archivedProjects.length === 0}
        <div class="empty-state">
          <p>No archived projects.</p>
        </div>
      {:else}
        <div class="projects-grid">
          {#each archivedProjects as project (project.id)}
            <div class="project-card archived">
              <div
                class="project-accent"
                style:background-color="#94a3b8"
              ></div>
              <div class="card-content">
                <div class="card-header">
                  <div class="title-area">
                    <h3>{project.name}</h3>
                  </div>
                  <div class="menu-container">
                    <button
                      aria-label="Project options"
                      class="menu-trigger"
                      onclick={(e) => toggleMenu(e, project.id)}
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
                        ><circle cx="12" cy="12" r="1" /><circle
                          cx="12"
                          cy="5"
                          r="1"
                        /><circle cx="12" cy="19" r="1" /></svg
                      >
                    </button>
                    {#if activeMenuId === project.id}
                      <div class="dropdown-menu card glass animate-fade-in">
                        <button
                          class="menu-item"
                          onclick={(e) => handleUnarchive(e, project.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path d="M3 12h18" /><path
                              d="m15 18 6-6-6-6"
                            /></svg
                          >
                          Unarchive
                        </button>
                        <div class="menu-divider"></div>
                        <button
                          class="menu-item delete"
                          onclick={(e) => handleDelete(e, project.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path d="M3 6h18" /><path
                              d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                            /><path
                              d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                            /><line x1="10" x2="10" y1="11" y2="17" /><line
                              x1="14"
                              x2="14"
                              y1="11"
                              y2="17"
                            /></svg
                          >
                          Delete
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
                {#if project.notes}
                  <p class="project-notes">{project.notes}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else if activeProjects.length === 0}
    <div class="empty-state">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-muted)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><rect width="18" height="18" x="3" y="3" rx="2" /><path
          d="M7 7h10"
        /><path d="M7 12h10" /><path d="M7 17h10" /></svg
      >
      <p>You haven't added any projects yet.</p>
    </div>
  {:else}
    <div class="projects-grid">
      {#each activeProjects as project (project.id)}
        <div
          class="project-card animate-fade-in"
          class:selected={timerStore.selectedProject?.id === project.id}
          onclick={() => handleSelect(project)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === "Enter" && handleSelect(project)}
        >
          <div
            class="project-accent"
            style:background-color={project.color}
          ></div>
          <div class="card-content">
            <div class="card-header">
              <div class="title-area">
                <h3>{project.name}</h3>
                {#if timerStore.selectedProject?.id === project.id}
                  <span class="active-badge">Active</span>
                {/if}
              </div>

              <div class="menu-container">
                <button
                  aria-label="Project options"
                  class="menu-trigger"
                  onclick={(e) => toggleMenu(e, project.id)}
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
                    ><circle cx="12" cy="12" r="1" /><circle
                      cx="12"
                      cy="5"
                      r="1"
                    /><circle cx="12" cy="19" r="1" /></svg
                  >
                </button>

                {#if activeMenuId === project.id}
                  <div class="dropdown-menu card glass animate-fade-in">
                    <button
                      class="menu-item"
                      onclick={(e) => handleEdit(e, project)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                          d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                        /><path d="m15 5 4 4" /></svg
                      >
                      Edit
                    </button>
                    <button
                      class="menu-item"
                      onclick={(e) => handleArchive(e, project.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                          d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                        /><polyline points="9 22 9 12 15 12 15 22" /></svg
                      >
                      Archive
                    </button>
                    <div class="menu-divider"></div>
                    <button
                      class="menu-item delete"
                      onclick={(e) => handleDelete(e, project.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M3 6h18" /><path
                          d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                        /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line
                          x1="10"
                          x2="10"
                          y1="11"
                          y2="17"
                        /><line x1="14" x2="14" y1="11" y2="17" /></svg
                      >
                      Delete
                    </button>
                  </div>
                {/if}
              </div>
            </div>
            {#if project.notes}
              <p class="project-notes">{project.notes}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if projectToEdit}
  <EditProjectModal
    project={projectToEdit}
    onClose={() => {
      projectToEdit = null;
    }}
  />
{/if}

<style>
  .projects-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .projects-header h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-main);
  }

  .toggle-archived-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .toggle-archived-btn:hover {
    color: var(--text-main);
    border-color: var(--text-muted);
    background: var(--bg-input);
  }

  .toggle-archived-btn.active {
    background: var(--accent-color);
    color: var(--text-inverse);
    border-color: var(--accent-color);
  }

  .archived-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-title {
    background: rgba(148, 163, 184, 0.1);
    padding: 1rem;
    border-radius: var(--radius-md);
    border-left: 4px solid #94a3b8;
  }

  .section-title h3 {
    font-size: 1rem;
    color: var(--text-main);
    margin-bottom: 0.25rem;
  }

  .section-title p {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .project-card.archived {
    opacity: 0.8;
    background: var(--bg-input);
  }

  .project-card.archived:hover {
    opacity: 1;
    transform: none;
  }

  .projects-container {
    width: 100%;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 4rem 2rem;
    color: var(--text-muted);
    text-align: center;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .project-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: visible;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: var(--shadow-sm);
  }

  .project-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--accent-color);
  }

  .project-card.selected {
    border-color: var(--accent-color);
    box-shadow:
      0 0 0 2px var(--accent-color),
      var(--shadow-lg);
  }

  .project-accent {
    height: 6px;
    width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .card-content {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
    position: relative;
  }

  .title-area {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .card-header h3 {
    font-size: 1.1rem;
    color: var(--text-main);
    line-height: 1.2;
  }

  .active-badge {
    align-self: flex-start;
    background: var(--accent-color);
    color: var(--text-inverse);
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    padding: 0.15rem 0.5rem;
    border-radius: 1rem;
    letter-spacing: 0.05em;
  }

  .menu-container {
    position: relative;
  }

  .menu-trigger {
    color: var(--text-muted);
    padding: 0.4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-trigger:hover {
    background: var(--bg-input);
    color: var(--text-main);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 100;
    min-width: 140px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 0.5rem;
    margin-top: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-main);
    width: 100%;
    text-align: left;
  }

  .menu-item:hover {
    background: var(--bg-input);
  }

  .menu-item.delete {
    color: #ef4444;
  }

  .menu-item.delete:hover {
    background: #fef2f2;
  }

  .menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.25rem 0;
  }

  .project-notes {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
    flex-grow: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
