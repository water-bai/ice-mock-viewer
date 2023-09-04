import APIGroupService from './api-group.js';
import GroupService from './group.js';
import ProjectService from './project.js';

export let handleFileChange = () => {};
export function bindFileChangeCallback(cb: () => void) {
  handleFileChange = cb;
}

export const projectService = new ProjectService();
export const groupService = new GroupService();
export const apiGroupService = new APIGroupService();
