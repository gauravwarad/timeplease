import { StorageService } from '../services/storage';
import type { Project } from '../types';

function createProjectsStore() {
    let projects = $state<Project[]>([]);

    return {
        get projects() {
            return projects;
        },
        async load() {
            projects = await StorageService.loadProjects();
        },
        async addProject(project: Omit<Project, 'id'>) {
            const newProject: Project = {
                ...project,
                id: crypto.randomUUID()
            };
            projects = [...projects, newProject];
            await StorageService.saveProjects(projects);
        },
        async deleteProject(id: string) {
            projects = projects.filter((p) => p.id !== id);
            await StorageService.saveProjects(projects);
        },
        async updateProject(id: string, updates: Partial<Project>) {
            projects = projects.map(p => p.id === id ? { ...p, ...updates } : p);
            await StorageService.saveProjects(projects);
        },
        async archiveProject(id: string) {
            projects = projects.map(p => p.id === id ? { ...p, is_archived: true } : p);
            await StorageService.saveProjects(projects);
        },
        async unarchiveProject(id: string) {
            projects = projects.map(p => p.id === id ? { ...p, is_archived: false } : p);
            await StorageService.saveProjects(projects);
        }
    };
}

export const projectStore = createProjectsStore();
