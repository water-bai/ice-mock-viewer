import BaseService, { ErrorType, Response } from './base.js';
import CommonService, { DataItem } from './common.js';
import SceneService from './scene.js';
import { projectService, apiGroupService, groupService, handleFileChange } from './index.js';
import { removeFromArray } from '../utils/index.js';
import FileService from './file.js';

export interface APIInfo extends DataItem{
  method: 'POST'|'GET';
  dynamic?: boolean;
}

export default class APIService extends CommonService<APIInfo> {
  static apiFileService: FileService<string[]>;
  groupId: string;
  constructor(groupId: string) {
    super(`.mock/api/${groupId}.json`);
    this.groupId = groupId;
    this.errorMap = {
      ...this.errorMap,
      [ErrorType.Repeat]: '已存在同名的接口！',
      [ErrorType.HasChild]: '当前接口下存在场景，不能被删除！',
    };
    if (!APIService.apiFileService) {
      APIService.apiFileService = new FileService<string[]>('.mock/api.json', { defaultData: [],
        watch: true,
        onChange: () => {
          if (!BaseService.innerSystemChange) {
            console.log('file changed and redeploy data');
            groupService.refresh();
            projectService.deploy();
            if (typeof handleFileChange === 'function') handleFileChange();
          }
          BaseService.innerSystemChange = false;
        } });
    }
  }
  add(g: Omit<APIInfo, 'uid'>): Response<any> {
    const list = APIService.apiFileService.read();
    // 判断api路径是否已存在
    if (list.includes(g.name)) {
      return this.response({
        success: false,
        message: this.errorMap[ErrorType.Repeat],
      });
    }
    APIService.apiFileService.write([...list, g.name]);
    const res = super.add(g);
    // 记录api和group的映射关系
    const apiId = res.data;
    apiGroupService.add(apiId, this.groupId);

    const childrenService = this.getChildrenService(apiId);
    if (!g.dynamic) {
      childrenService.add({
        name: '成功',
        response: JSON.stringify({
          code: 200,
          success: true,
          message: 'SUCCSS',
          data: {},
        }),
      });
      childrenService.add({
        name: '失败',
        response: JSON.stringify({
          code: 200,
          success: false,
          message: 'ERROR',
        }),
      });
    } else {
      childrenService.add({
        name: '成功',
        response: `(req, res) => {
          const { query } = req;
          let result = {}
          if (query) {
            result = {
              code: 200,
              success: true,
              message: 'SUCCSS',
              data: query,
            };
          } else {
            result = {
              code: 200,
              success: true,
              message: 'SUCCSS',
              data: {},
            };
          }
          res.send(Mock.mock(result));
        }`,
      });
      childrenService.add({
        name: '失败',
        response: `(req, res) => {
          const { query } = req;
          let result = {};
          if (query) {
            result = {
              code: 200,
              success: false,
              message: 'ERROR',
            };
          } else {
            result = {
              code: 200,
              success: false,
              message: 'ERROR',
            };
          }
          res.send(Mock.mock(result));
        }`,
      });
    }
    return res;
  }

  update(g: APIInfo): void {
    const pre = this.data.valueMap[g.uid];
    this._updateApiNames(pre.name, g.name);
    super.update(g);
    // 名称或者请求方法不同，需要同步数据
    if (pre.method !== g.method || pre.name !== g.name) {
      // deploy数据
      projectService.deploy(this.groupId, g.uid);
    }
  }

  switchGroup(targetGroupId: string, apiId: string) {
    if (targetGroupId === this.groupId) {
      return this.response({
        success: false,
        message: '已在当前分组',
      });
    }
    this.refresh();

    const targetAPIService = new APIService(targetGroupId);
    const apiInfo = { ...this.data.valueMap[apiId] };

    super.delete(apiId);

    targetAPIService.data.valueMap[apiId] = apiInfo;
    targetAPIService.data.valueNames.push(apiInfo.name);
    targetAPIService.save();

    apiGroupService.update(apiId, targetGroupId);
    return this.response();
  }

  delete(apiId: string) {
    const { valueMap } = this.data;
    const apiInfo = valueMap[apiId];
    const res = super.delete(apiId);
    // API删除成功后移除其唯一标识
    if (res.success) {
      this._updateApiNames(apiInfo.name);

      this.deleteChildren(apiId);

      // 删除api和group的映射关系
      apiGroupService.delete(apiId);
    }
    return res;
  }
  protected getChildrenService(apiId: string) {
    return new SceneService(apiId);
  }

  private _updateApiNames(preName: string, name?: string) {
    const apiNames = APIService.apiFileService.read();
    if (preName) {
      removeFromArray(apiNames, preName);
    }
    if (name) {
      apiNames.push(name);
    }
    APIService.apiFileService.write(apiNames);
  }
}
