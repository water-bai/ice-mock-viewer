import { ErrorType, Response } from './base.js';
import CommonService, { CommonData, DataItem } from './common.js';
import { apiGroupService, projectService } from './index.js';

export interface SceneInfo extends DataItem{
  response: string;
  active?: boolean;
}

export interface SceneData extends CommonData<SceneInfo>{
  activeSceneId?: string;
}

export default class SceneService extends CommonService<SceneInfo, SceneData> {
  apiId: string;
  constructor(apiId: string) {
    super(`.mock/scene/${apiId}.json`);
    this.apiId = apiId;
    this.errorMap = {
      ...this.errorMap,
      [ErrorType.Repeat]: '已存在同名的场景！',
    };
  }
  add(g: Omit<SceneInfo, 'uid'>): Response<any> {
    const res = super.add(g);
    if (res.success) {
      const { valueNames, valueMap } = this.data;
      if (valueNames.length === 1) {
      // 默认激活第一个场景
        const sceneId = Object.keys(valueMap)[0];
        valueMap[sceneId].active = true;
        this._setActiveSceneId(sceneId);
      }
    }
    return res;
  }
  update(g: SceneInfo) {
    super.update(g);
    if (g.uid === this.data.activeSceneId || g.active) {
      this._setActiveSceneId(g.uid);
    }
  }
  delete(sceneId: string): Response<any> {
    const res = super.delete(sceneId);
    const { activeSceneId, valueMap, valueNames } = this.data;
    // 如果当前激活的场景被删除，重新设置默认激活的场景
    if (activeSceneId === sceneId && valueNames.length) {
      const nextActiveSceneName = valueNames[0];
      const nextActiveSceneId = Object.keys(valueMap).find((item) => valueMap[item].name === nextActiveSceneName);
      if (nextActiveSceneId) {
        valueMap[nextActiveSceneId].active = true;
        this._setActiveSceneId(nextActiveSceneId);
      }
    } else if (!valueNames.length) {
      this._setActiveSceneId('');
    }
    return res;
  }
  /**
   * 激活场景
   * @param sceneId 场景ID
   */
  active(sceneId: string) {
    const { valueMap } = this.data;
    // 激活指定场景，同时失活其他场景
    for (const _sceneId in valueMap) {
      if (Object.prototype.hasOwnProperty.call(valueMap, _sceneId)) {
        const scene = valueMap[_sceneId];
        if (_sceneId === sceneId) scene.active = true;
        else scene.active = false;
      }
    }
    // 记录当前激活的场景ID
    this._setActiveSceneId(sceneId);
  }
  protected getChildren(): SceneInfo[] {
    return [];
  }
  protected getChildrenService(): CommonService<DataItem, CommonData<DataItem>> {
    throw new Error('Method not implemented.');
  }

  private _setActiveSceneId(sceneId: string) {
    this.data.activeSceneId = sceneId;
    this.save();
    if (sceneId) {
      const groupId: string = apiGroupService.get().data[this.apiId];
      projectService.deploy(groupId, this.apiId);
    } else {
      projectService.deploy(undefined, this.apiId);
    }
  }
}
