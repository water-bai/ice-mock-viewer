import glob from 'glob';
import { rootDir } from '../utils/index.js';
import BaseService, { Response } from './base.js';
import { CommonData } from './common.js';
import FileService from './file.js';
import { groupService, projectService } from './index.js';

export default class APIGroupService extends BaseService<Record<string, string>> {
  constructor() {
    super('.mock/api/index.json');
    // 每次重新生成api-gruop的映射关系
    setTimeout(() => {
      // 通过异步解决循环应用导致的初始化问题
      this._init();
    }, 500);
  }
  add(apiId: string, groupId: string): Response<any> | undefined {
    this.data[apiId] = groupId;
    this.save();
    return this.response();
  }
  delete(apiId: string): Response<any> | undefined {
    delete this.data[apiId];
    this.save();
    return this.response();
  }
  update(apiId: string, groupId: string): void {
    this.data[apiId] = groupId;
    this.save();
  }
  private _init() {
    const groupMap = groupService.get().data.valueMap;
    for (const groupId in groupMap) {
      if (Object.prototype.hasOwnProperty.call(groupMap, groupId)) {
        const apiService = new FileService<CommonData>(`.mock/api/${groupId}.json`);
        const apiMap = apiService.read().valueMap;
        for (const apiId in apiMap) {
          if (Object.prototype.hasOwnProperty.call(apiMap, apiId)) {
            this.data[apiId] = groupId;

            // 判断当前api的激活场景数据是否已同步本地，没有则同步
            const result = glob.sync(`${rootDir}/mock/${apiId}*.js`);
            if (!result.length) {
              // 文件不存在，需要同步
              projectService.deploy(groupId, apiId);
            }
          }
        }
      }
    }
    this.save();
  }
}
