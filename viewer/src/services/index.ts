import { APIInfo, DataItem, GroupInfo, ProjectInfo, SceneInfo } from '@/interface';
import request from './ws';

export function getProject() {
  return request<ProjectInfo>('/project/get');
}
export function addGroup(groupInfo: Omit<DataItem, 'uid'>) {
  return request('/group/add', [groupInfo]);
}
export function getGroupList() {
  return request<GroupInfo[]>('/group/getList');
}
export function deleteGroup(groupId: string) {
  return request('/group/delete', [groupId]);
}

export function addApi(groupId: string, apiInfo: Omit<APIInfo, 'uid'>) {
  if (apiInfo.method === 'POST') delete apiInfo.dynamic;
  return request('/api/add', [groupId, apiInfo]);
}

export function editApi(groupId: string, apiInfo: APIInfo) {
  return request('/api/update', [groupId, apiInfo]);
}
export function switchApiGroup(groupId: string, targetGroupId: string, apiId: string) {
  return request('/api/switchGroup', [groupId, targetGroupId, apiId]);
}

export function deleteApi(groupId: string, apiId: string) {
  return request('/api/delete', [groupId, apiId]);
}

export async function getSceneList(apiId: string): Promise<SceneInfo[]> {
  return request<SceneInfo[]>('/scene/getList', [apiId]).then((res) => {
    return res;
  });
}

export function addScene(apiId: string, sceneInfo: Omit<SceneInfo, 'uid'>) {
  return request('/scene/add', [apiId, sceneInfo]);
}
export async function editScene(apiId: string, sceneInfo: SceneInfo) {
  return request('/scene/update', [apiId, sceneInfo]);
}
export function deleteScene(apiId: string, sceneId: string) {
  return request('/scene/delete', [apiId, sceneId]);
}
export function switchActiveScene(apiId: string, sceneId: string) {
  return request('/scene/active', [apiId, sceneId]);
}
export function deploy() {
  return request('/project/deploy');
}
export function checkVersion() {
  return request('/project/checkVersion');
}

