import APIService from './api.js';
import { ErrorType, Response } from './base.js';
import CommonService from './common.js';


export default class GroupService extends CommonService {
  constructor() {
    super('.mock/group.json');
    this.needResponseChildren = true;
    this.errorMap = {
      ...this.errorMap,
      [ErrorType.Repeat]: '已存在同名的分组！',
      [ErrorType.HasChild]: '当前分组下存在接口，不能被删除！',
    };
    if (this.data.valueNames.length === 0) {
      this.add({
        name: '默认分组',
        description: '这是默认分组',
      });
    }
  }

  delete(groupId: string): Response<any> {
    const res = super.delete(groupId);
    if (res.success) { this.deleteChildren(groupId); }
    return res;
  }
  protected getChildrenService(groupId: string) {
    return new APIService(groupId);
  }
}
