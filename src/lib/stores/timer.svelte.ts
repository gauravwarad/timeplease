import { settingsStore } from './settings.svelte';
import { emit } from '@tauri-apps/api/event';
import type { Project, TimerMode, TimerStatus } from '../types';
import { notify } from '../utils/notifications';

function createTimerStore() {
    let _time = $state(0);
    let _mode = $state<TimerMode>('FLOW');
    let _status = $state<TimerStatus>('IDLE');
    let _pomodoroCycle = $state(1);
    let _selectedProject = $state<Project | null>(null);
    let _isBreak = $state(false);
    let _completedSession = $state<{
        elapsedSeconds: number;
        mode: TimerMode;
        projectId: string;
    } | null>(null);

    let intervalId: number | null = null;

    function emitTimerState() {
        emit('timer-tick', {
            time: _time,
            mode: _mode,
            status: _status,
            projectColor: _selectedProject?.color,
            isBreak: _isBreak
        }).catch(err => console.error("Failed to emit timer-tick", err));
    }

    function clearTimer() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function handlePomodoroFinish() {
        clearTimer();

        if (!_isBreak) {
            // Work session finished -> Switch to Break
            notify('Work session finished', 'Time to take a break!', 'pomo');

            // Record completed session for logging
            if (_selectedProject) {
                _completedSession = {
                    elapsedSeconds: settingsStore.pomodoroDuration * 60,
                    mode: _mode,
                    projectId: _selectedProject.id
                };
            }

            _isBreak = true;
            _status = 'IDLE'; // Waiting for start

            // Determine break length based on cycle count
            if (_pomodoroCycle % settingsStore.pomodoroSessionsBeforeLongBreak === 0) {
                _time = settingsStore.longBreakDuration * 60;
            } else {
                _time = settingsStore.breakDuration * 60;
            }
        } else {
            // Break finished -> Switch to next Work Session
            notify('Break finished', 'Time to get back to work!', 'pomo');
            _isBreak = false;
            _pomodoroCycle += 1;
            _status = 'IDLE';
            _time = settingsStore.pomodoroDuration * 60;
        }
        emitTimerState();
    }

    function tick() {
        if (_mode === 'FLOW') {
            _time += 1;
            // Notify every X minutes (configurable)
            const intervalSeconds = settingsStore.flowNotificationInterval * 60;
            if (_time > 0 && _time % intervalSeconds === 0) {
                const hours = Math.floor(_time / 3600);
                const mins = Math.floor((_time % 3600) / 60);
                let timeStr = "";
                if (hours > 0) timeStr += `${hours}h `;
                timeStr += `${mins}m`;
                notify('Flow Milestone', `You've been working for ${timeStr.trim()}. Keep it up or take a break?`, 'flow');
            }
        } else if (_mode === 'POMO') {
            if (_time > 0) {
                _time -= 1;
            } else {
                handlePomodoroFinish();
                return; // handlePomodoroFinish calls emitTimerState
            }
        }
        emitTimerState();
    }

    function resetTimerState() {
        clearTimer();
        _status = 'IDLE';
        _isBreak = false;

        if (_mode === 'POMO') {
            _time = settingsStore.pomodoroDuration * 60;
        } else {
            _time = 0;
        }
        emitTimerState();
    }

    return {
        get time() { return _time; },
        get mode() { return _mode; },
        get status() { return _status; },
        get pomodoroCycle() { return _pomodoroCycle; },
        get selectedProject() { return _selectedProject; },
        get isBreak() { return _isBreak; },
        get completedSession() { return _completedSession; },

        clearCompletedSession() {
            _completedSession = null;
        },

        // Manually trigger the honesty modal (e.g. from manual stop)
        showHonestyModal(elapsedSeconds: number, mode: TimerMode, projectId: string) {
            _completedSession = { elapsedSeconds, mode, projectId };
        },

        setProject(project: Project | null) {
            // Guard: cannot unselect project if timer is running/paused/break
            if (project === null && _status !== 'IDLE') {
                return;
            }
            _selectedProject = project;
            emitTimerState();
        },

        setMode(newMode: TimerMode) {
            _mode = newMode;
            // Reset cycle on mode change? Usually yes.
            _pomodoroCycle = 1;
            resetTimerState();
        },

        // Call this when settings change or app loads to ensure correct initial time
        syncSettings() {
            if (_status === 'IDLE' && _mode === 'POMO' && !_isBreak) {
                _time = settingsStore.pomodoroDuration * 60;
                emitTimerState();
            }
        },

        start() {
            if (!_selectedProject) return;
            if (_status === 'RUNNING' || (_status === 'BREAK' && _mode === 'POMO')) return;

            // Determine next status
            if (_mode === 'FLOW') {
                _status = 'RUNNING';
            } else {
                // POMO
                // If it was IDLE or PAUSED, we resume/start.
                // If isBreak is true, status becomes BREAK (running break).
                // If isBreak is false, status becomes RUNNING (running work).
                _status = _isBreak ? 'BREAK' : 'RUNNING';
            }

            clearTimer();
            intervalId = setInterval(tick, 1000);
            tick(); // Immediate tick for responsiveness? Or wait 1s? usually wait.
            // If we tick immediately we skip 1 second. Better to just emit state.
            emitTimerState();
        },

        pause() {
            if (_status === 'IDLE') return;
            _status = 'PAUSED';
            clearTimer();
            emitTimerState();
        },


        stop() {
            const currentMode = _mode;
            const currentStatus = _status;
            const currentIsBreak = _isBreak;

            let elapsed = 0;
            if (currentMode === 'FLOW') {
                elapsed = _time;
            } else {
                // POMODORO
                if (currentIsBreak) {
                    // Logic for break elapsed? 
                    // We can assume full duration - time, or just ignore exact seconds for break
                    const totalBreak = (_pomodoroCycle % settingsStore.pomodoroSessionsBeforeLongBreak === 0)
                        ? settingsStore.longBreakDuration * 60
                        : settingsStore.breakDuration * 60;
                    elapsed = totalBreak - _time;
                } else {
                    const totalWork = settingsStore.pomodoroDuration * 60;
                    elapsed = totalWork - _time;
                }
            }

            resetTimerState();

            return {
                mode: currentMode,
                status: currentStatus,
                isBreak: currentIsBreak,
                elapsedSeconds: Math.max(0, Math.floor(elapsed)) // Prevent negative if something weird happens
            };
        },

        sync() {
            emitTimerState();
        }
    };
}

export const timerStore = createTimerStore();
