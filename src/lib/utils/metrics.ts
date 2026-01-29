import type { Session, Project } from '../types';
import { getLocalDateFromISO, getWeekNumber, getMonthYearString } from './date';

export interface ProjectTotal {
    project_id: string;
    project_name: string;
    project_color: string;
    actual_work_minutes: number;
    elapsed_minutes: number;
}

export interface DayStats {
    date: string; // YYYY-MM-DD
    projects: ProjectTotal[];
    total_actual_work_minutes: number;
    total_elapsed_minutes: number;
    efficiency: number;
}

export interface WeekStats {
    weekNumber: number;
    total_actual_work_minutes: number;
    days: DayStats[];
}

export interface MonthStats {
    monthName: string; // "December 2025"
    total_actual_work_minutes: number;
    days_worked: number;
    weeks: WeekStats[];
}

export function groupSessionsByDayAndProject(sessions: Session[], projects: Project[]): DayStats[] {
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const dayMap = new Map<string, Map<string, ProjectTotal>>();

    sessions.forEach(session => {
        const date = getLocalDateFromISO(session.start_time);
        if (!dayMap.has(date)) {
            dayMap.set(date, new Map());
        }

        const projectDayMap = dayMap.get(date)!;
        if (!projectDayMap.has(session.project_id)) {
            const project = projectMap.get(session.project_id);
            projectDayMap.set(session.project_id, {
                project_id: session.project_id,
                project_name: project?.name || 'Unknown Project',
                project_color: project?.color || '#ccc',
                actual_work_minutes: 0,
                elapsed_minutes: 0
            });
        }

        const stats = projectDayMap.get(session.project_id)!;
        stats.actual_work_minutes += session.actual_work_minutes;
        stats.elapsed_minutes += session.elapsed_seconds / 60;
    });

    const result: DayStats[] = Array.from(dayMap.entries()).map(([date, projectDayMap]) => {
        const projectTotals = Array.from(projectDayMap.values());
        const total_actual = projectTotals.reduce((sum, p) => sum + p.actual_work_minutes, 0);
        const total_elapsed = projectTotals.reduce((sum, p) => sum + p.elapsed_minutes, 0);

        return {
            date,
            projects: projectTotals,
            total_actual_work_minutes: total_actual,
            total_elapsed_minutes: total_elapsed,
            efficiency: calculateEfficiency(total_actual, total_elapsed)
        };
    });

    return result.sort((a, b) => b.date.localeCompare(a.date));
}

export function calculateEfficiency(actualMinutes: number, elapsedMinutes: number): number {
    if (elapsedMinutes === 0) return 0;
    return (actualMinutes / elapsedMinutes) * 100;
}

export function groupSessionsByMonthAndWeek(sessions: Session[], projects: Project[]): MonthStats[] {
    const dailyStats = groupSessionsByDayAndProject(sessions, projects);
    const monthMap = new Map<string, MonthStats>();

    dailyStats.forEach(day => {
        const dateObj = new Date(day.date);
        const monthKey = getMonthYearString(dateObj);
        const weekNum = getWeekNumber(dateObj);

        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, {
                monthName: monthKey,
                total_actual_work_minutes: 0,
                days_worked: 0,
                weeks: []
            });
        }

        const monthStats = monthMap.get(monthKey)!;
        monthStats.total_actual_work_minutes += day.total_actual_work_minutes;
        monthStats.days_worked += 1;

        let weekStats = monthStats.weeks.find(w => w.weekNumber === weekNum);
        if (!weekStats) {
            weekStats = {
                weekNumber: weekNum,
                total_actual_work_minutes: 0,
                days: []
            };
            monthStats.weeks.push(weekStats);
        }

        weekStats.total_actual_work_minutes += day.total_actual_work_minutes;
        weekStats.days.push(day);
    });

    // Sort weeks within months and return sorted months
    const sortedMonths = Array.from(monthMap.values()).map(m => {
        m.weeks.sort((a, b) => b.weekNumber - a.weekNumber);
        m.weeks.forEach(w => {
            w.days.sort((a, b) => b.date.localeCompare(a.date));
        });
        return m;
    });

    return sortedMonths.sort((a, b) => {
        const dateA = new Date(a.monthName);
        const dateB = new Date(b.monthName);
        return dateB.getTime() - dateA.getTime();
    });
}
