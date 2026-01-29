<script lang="ts">
  import { projectStore } from "../lib/stores/projects.svelte";
  import { fade, slide } from "svelte/transition";

  let isExpanded = $state(false);
  let name = $state("");
  let color = $state("#6366f1"); // Default Indigo
  let notes = $state("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name.trim()) return;

    await projectStore.addProject({
      name: name.trim(),
      color,
      notes: notes.trim(),
    });

    // Reset form
    name = "";
    color = "#6366f1";
    notes = "";
    isExpanded = false;
  }
</script>

<div class="add-project-wrapper">
  {#if !isExpanded}
    <button class="expand-btn" onclick={() => (isExpanded = true)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
      >
      New Project
    </button>
  {:else}
    <div class="form-container" transition:slide>
      <form
        onsubmit={handleSubmit}
        class="add-project-form card animate-fade-in"
      >
        <div class="form-header">
          <h3>Create Project</h3>
          <button
            type="button"
            class="close-btn"
            onclick={() => (isExpanded = false)}
            aria-label="Close"
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
              ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
            >
          </button>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label for="new-project-name">Project Name</label>
            <input
              type="text"
              id="new-project-name"
              bind:value={name}
              required
              placeholder="e.g. Deep Work, Learning"
            />
          </div>

          <div class="form-row">
            <div class="form-group color-group">
              <label for="new-project-color">Accent Color</label>
              <div class="color-input-wrapper">
                <input type="color" id="new-project-color" bind:value={color} />
                <span class="color-preview" style:background-color={color}
                ></span>
                <span class="color-hex">{color}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="new-project-notes">Notes (Optional)</label>
            <textarea
              id="new-project-notes"
              bind:value={notes}
              placeholder="What is this project about?"
              rows="2"
            ></textarea>
          </div>
        </div>

        <div class="form-footer">
          <button
            type="button"
            class="btn-cancel"
            onclick={() => (isExpanded = false)}>Cancel</button
          >
          <button type="submit" class="btn-submit" disabled={!name.trim()}
            >Create Project</button
          >
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .add-project-wrapper {
    position: relative;
    z-index: 10;
  }

  .expand-btn {
    background: var(--accent-color);
    color: var(--text-inverse);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    border-radius: var(--radius-md);
    font-weight: 700;
    box-shadow: var(--shadow-md);
  }

  .expand-btn:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-lg);
  }

  .form-container {
    position: absolute;
    top: 0;
    right: 0;
    width: 320px;
  }

  .add-project-form {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .close-btn {
    color: var(--text-muted);
    padding: 0.25rem;
  }

  .close-btn:hover {
    color: var(--text-main);
  }

  .form-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-group label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .color-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--bg-input);
    padding: 0.4rem 0.75rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    position: relative;
  }

  input[type="color"] {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .color-preview {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .color-hex {
    font-size: 0.85rem;
    font-weight: 600;
    font-family: monospace;
    color: var(--text-main);
  }

  textarea {
    resize: none;
  }

  .form-footer {
    display: flex;
    gap: 0.75rem;
  }

  .btn-submit {
    flex-grow: 1;
    background: var(--accent-color);
    color: var(--text-inverse);
    padding: 0.6rem;
    border-radius: var(--radius-md);
    font-weight: 700;
  }

  .btn-submit:disabled {
    opacity: 0.5;
  }

  .btn-cancel {
    padding: 0.6rem 1rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .btn-cancel:hover {
    color: var(--text-main);
  }
</style>
