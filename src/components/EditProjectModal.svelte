<script lang="ts">
    import { untrack } from "svelte";
    import { projectStore } from "../lib/stores/projects.svelte";
    import { fade, scale } from "svelte/transition";
    import type { Project } from "../lib/types";

    let { project, onClose } = $props<{
        project: Project;
        onClose: () => void;
    }>();

    let name = $state(untrack(() => project.name));
    let color = $state(untrack(() => project.color));
    let notes = $state(untrack(() => project.notes));

    async function handleSave(e: Event) {
        e.preventDefault();
        if (!name.trim()) return;

        await projectStore.updateProject(project.id, {
            name: name.trim(),
            color,
            notes: notes.trim(),
        });

        onClose();
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="modal-backdrop"
    onclick={onClose}
    transition:fade={{ duration: 200 }}
>
    <div
        class="modal card glass animate-fade-in"
        onclick={(e) => e.stopPropagation()}
        transition:scale={{ duration: 200, start: 0.95 }}
    >
        <div class="form-header">
            <h3>Edit Project</h3>
            <button
                type="button"
                class="close-btn"
                onclick={onClose}
                aria-label="Close"
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
                    ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                >
            </button>
        </div>

        <form onsubmit={handleSave}>
            <div class="form-body">
                <div class="form-group">
                    <label for="edit-project-name">Project Name</label>
                    <input
                        type="text"
                        id="edit-project-name"
                        bind:value={name}
                        required
                        placeholder="e.g. Deep Work, Learning"
                    />
                </div>

                <div class="form-group">
                    <label for="edit-project-color">Accent Color</label>
                    <div class="color-input-wrapper">
                        <input
                            type="color"
                            id="edit-project-color"
                            bind:value={color}
                        />
                        <span
                            class="color-preview"
                            style:background-color={color}
                        ></span>
                        <span class="color-hex">{color}</span>
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-project-notes">Notes (Optional)</label>
                    <textarea
                        id="edit-project-notes"
                        bind:value={notes}
                        placeholder="What is this project about?"
                        rows="3"
                    ></textarea>
                </div>
            </div>

            <div class="form-footer">
                <button type="button" class="btn-cancel" onclick={onClose}
                    >Cancel</button
                >
                <button type="submit" class="btn-submit" disabled={!name.trim()}
                    >Save Changes</button
                >
            </div>
        </form>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }

    .modal {
        background: var(--bg-card);
        padding: 2rem;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        width: 100%;
        max-width: 440px;
        border: 1px solid var(--border-color);
    }

    .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .close-btn {
        color: var(--text-muted);
        padding: 0.5rem;
        border-radius: 50%;
    }

    .close-btn:hover {
        background: var(--bg-input);
        color: var(--text-main);
    }

    .form-body {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
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
        padding: 0.5rem 0.75rem;
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
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .color-hex {
        font-size: 0.9rem;
        font-weight: 600;
        font-family: monospace;
        color: var(--text-main);
    }

    textarea {
        resize: none;
    }

    .form-footer {
        display: flex;
        gap: 1rem;
    }

    .btn-submit {
        flex-grow: 1;
        background: var(--accent-color);
        color: var(--text-inverse);
        padding: 0.75rem;
        border-radius: var(--radius-md);
        font-weight: 700;
    }

    .btn-submit:disabled {
        opacity: 0.5;
    }

    .btn-cancel {
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius-md);
        color: var(--text-muted);
        font-weight: 600;
    }

    .btn-cancel:hover {
        background: var(--bg-input);
        color: var(--text-main);
    }
</style>
