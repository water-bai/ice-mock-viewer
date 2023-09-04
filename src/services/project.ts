import path from 'path';
import fs from 'fs';
import { getPkgJson, getProjectPkgJson } from '../utils/index.js';
import getLatestVersion from '../utils/version.js';
import APIService from './api.js';
import BaseService, { Response } from './base.js';
import MockService from './mock.js';
import { groupService } from './index.js';

export interface ProjectInfo{
  name: string;
  description: string;
}

export default class ProjectService extends BaseService<ProjectInfo> {
  constructor() {
    const { name, description } = getProjectPkgJson();
    super('.mock/project.json', {
      defaultData: { name, description },
      overwrite: true,
    });
    this._addReadme();
  }
  add(...args: any[]): Response<any> {
    throw new Error('Method not implemented.');
  }
  delete(...args: any[]): Response<any> {
    throw new Error('Method not implemented.');
  }
  update(...args: any[]): void {
    throw new Error('Method not implemented.');
  }

  deploy(groupId?: string, apiId?: string) {
    // 只同步指定url的mock数据
    const mockService = new MockService();
    if (apiId) {
      if (groupId) {
        const apiService = new APIService(groupId);
        const apiInfo = apiService.get().data.valueMap[apiId];
        if (apiInfo) { mockService.write(apiInfo); }
      } else {
        // 删除对应mock文件
        mockService.delete(apiId);
      }
    } else {
      // 删除先前的mock数据
      mockService.remove();
      // 同步所有的mock数据
      const { data: { valueMap: groupMap } } = groupService.get();

      for (const gId in groupMap) {
        if (Object.hasOwnProperty.call(groupMap, gId)) {
          const { data: { valueMap: apiMap } } = new APIService(gId).get();
          for (const aId in apiMap) {
            if (Object.hasOwnProperty.call(apiMap, aId)) {
              mockService.write(apiMap[aId]);
            }
          }
        }
      }
    }
  }
  checkVersion() {
    const currentVersion = getPkgJson().version;
    const { version, betaVersion } = getLatestVersion();
    return this.response({
      data: {
        currentVersion,
        version,
        betaVersion,
      },
    });
  }

  private _addReadme() {
    const rootDir = process.cwd();
    const readmePath = path.join(rootDir, '.mock/README.md');
    if (!fs.existsSync(readmePath)) {
      const readmeText = `注意！！！注意！！！注意！！！

- 当前文件夹下的内容为本地mock服务的原始数据和配置文件
- 由[ice-mock-viewer](https://npm.alibaba-inc.com/package/ice-mock-viewer)插件自动生成，请勿编辑;
- 请不要将该文件夹添加到.gitignore 中，需上传远程 git 仓库;
`;
      fs.writeFileSync(readmePath, readmeText);
    }
  }
}
