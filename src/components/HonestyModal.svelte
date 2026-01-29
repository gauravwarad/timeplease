<script lang="ts">
    import { untrack } from "svelte";
    import { fade, scale } from "svelte/transition";

    /**
     * HonestyModal.svelte
     * A modal that appears when a session stops, asking the user to verify their actual work time.
     */

    interface Props {
        elapsedSeconds: number;
        defaultLabel?: string;
        onSave: (actualMinutes: number, label: string) => void;
        onCancel: () => void;
    }

    let {
        elapsedSeconds,
        defaultLabel = "",
        onSave,
        onCancel,
    }: Props = $props();

    let actualMinutes = $state(untrack(() => Math.floor(elapsedSeconds / 60)));
    let label = $state(untrack(() => defaultLabel));

    function handleSave() {
        onSave(actualMinutes, label);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="modal-backdrop"
    onclick={onCancel}
    transition:fade={{ duration: 200 }}
>
    <div
        class="modal glass animate-fade-in"
        onclick={(e) => e.stopPropagation()}
        transition:scale={{ duration: 200, start: 0.95 }}
    >
        <h2>Honesty Check</h2>
        <p class="summary">
            You recorded <strong
                >{Math.floor(elapsedSeconds / 60)} minutes</strong
            >. How focused were you?
        </p>

        <div class="form-body">
            <div class="field">
                <label for="minutes">Actual Focused Minutes</label>
                <div class="input-with-suffix">
                    <input
                        id="minutes"
                        type="number"
                        bind:value={actualMinutes}
                        min="0"
                        max={Math.ceil(elapsedSeconds / 60) + 60}
                    />
                    <span class="suffix">min</span>
                </div>
            </div>

            <div class="field">
                <label for="modal-label">Session Label</label>
                <input
                    id="modal-label"
                    type="text"
                    bind:value={label}
                    placeholder="What did you focus on?"
                />
            </div>
        </div>

        <div class="actions">
            <button class="btn btn-secondary" onclick={onCancel}>Discard</button
            >
            <button class="btn btn-primary" onclick={handleSave}
                >Log Session</button
            >
        </div>
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
        padding: 2.5rem;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        width: 100%;
        max-width: 440px;
        border: 1px solid var(--border-color);
    }

    h2 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: var(--text-main);
        font-family: var(--font-display);
    }

    .summary {
        color: var(--text-muted);
        margin-bottom: 2rem;
        font-size: 0.95rem;
    }

    .form-body {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
    }

    .input-with-suffix {
        position: relative;
        display: flex;
        align-items: center;
    }

    .input-with-suffix input {
        padding-right: 3rem;
    }

    .suffix {
        position: absolute;
        right: 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-muted);
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2.5rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius-md);
        font-size: 1rem;
        font-weight: 700;
        transition: all 0.2s;
    }

    .btn-secondary {
        background: var(--bg-input);
        color: var(--text-main);
    }

    .btn-secondary:hover {
        background: var(--border-color);
    }

    .btn-primary {
        background: var(--accent-color);
        color: var(--text-inverse);
        flex-grow: 1;
    }

    .btn-primary:hover {
        transform: scale(1.02);
        box-shadow: var(--shadow-md);
    }
</style>
