import { removeFromArray } from '../utils/index.js';
import { uid as _uid } from 'uid';
import BaseService, { ErrorType, Response } from './base.js';
import { FileServiceOptions } from './file.js';
// @ts-ignore
const getUniqueId = _uid.default || _uid;
export interface DataItem{
  uid: string;
  name: string;
  description?: string;
  children?: any[];
}

export interface CommonData<R extends DataItem=DataItem>{
  valueNames: string[];
  valueMap: {[key: string]: R};
}

export default abstract class CommonService<R extends DataItem=DataItem, T extends CommonData<R>=CommonData<R>> extends BaseService<T> {
  needResponseChildren=false;
  constructor(relativeFilePath: string, options?: FileServiceOptions<T>) {
    super(relativeFilePath, {
      defaultData: {
        valueMap: {},
        valueNames: [],
      } as any,
      ...options,
    });
    if (!this.data.valueMap) this.data.valueMap = {};
    if (!this.data.valueNames) this.data.valueNames = [];
  }
  add(g: Omit<R, 'uid'>) {
    const uid = getUniqueId(6);
    const { valueNames, valueMap } = this.data;
    if (valueNames.includes(g.name)) {
      return this.response({
        success: false,
        message: this.errorMap[ErrorType.Repeat],
      });
    }
    valueNames.push(g.name);
    valueMap[uid] = {
      ...g,
      uid,
    } as any;
    this.save();
    return this.response({ data: uid });
  }
  delete(uid: string) {
    const { valueNames, valueMap } = this.data;
    const target = valueMap[uid];
    if (target) {
      removeFromArray(valueNames, target.name);
      delete valueMap[uid];
      this.save();
    }
    return this.response();
  }
  update(g: R) {
    const pre = this.data.valueMap[g.uid];
    if (g.name !== pre.name) { removeFromArray(this.data.valueNames, pre.name, g.name); }
    delete g.children;
    this.data.valueMap[g.uid] = g as R;
    this.save();
  }

  getList(): Response<R[]> {
    const { valueMap } = this.data;
    const result: R[] = [];
    for (const uid in valueMap) {
      if (Object.prototype.hasOwnProperty.call(valueMap, uid)) {
        const target = valueMap[uid];
        const targetChildren = this.needResponseChildren ? this.getChildren(uid) : [];
        result.push({ ...target, children: targetChildren });
      }
    }
    return this.response({ data: result });
  }
  protected getChildren(uid: string): DataItem[] {
    const childService = this.getChildrenService(uid);
    return childService.getList().data as DataItem[];
  }
  protected deleteChildren(uid: string): void {
    const childService = this.getChildrenService(uid);
    for (const key in childService.data.valueMap) {
      if (Object.prototype.hasOwnProperty.call(childService.data.valueMap, key)) {
        childService.delete(key);
      }
    }
    childService.removeFile();
  }
  protected abstract getChildrenService(uid: string): CommonService;
}
