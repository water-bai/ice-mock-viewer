import path from 'path';
import FileService, { FileServiceOptions } from './file.js';

export interface Response<T=any>{
  success: boolean;
  data?: T;
  message: string;
  // code: ResponseCode;
}

// export enum ResponseCode{
//   Success='SUCCESS',
//   Repeat='REPEAT',

//   SystemError='SYSTEM_ERROR'
// }

export enum ErrorType{
  Repeat,
  SystemError,
  HasChild,
}

export default abstract class BaseService< T extends Record<string, any>={}, > {
  static innerSystemChange: boolean;
  protected errorMap={
    [ErrorType.Repeat]: '当前已存在同名记录！',
    [ErrorType.SystemError]: '系统异常！',
    [ErrorType.HasChild]: '当前节点下存在子节点，不能被删除！',
  };
  protected data: T;
  protected fileService: FileService<T>;
  constructor(relativeFilePath: string, options?: FileServiceOptions<T>) {
    const rootDir = process.cwd();
    this.fileService = new FileService<T>(
      path.join(rootDir, relativeFilePath),
      options,
    );
    this.data = this.fileService.read();
  }

  refresh() {
    this.data = this.fileService.read();
  }

  get(): Response<T> {
    return this.response({ data: this.data as any });
  }
  /**
   * 删除文件
   */
  removeFile() {
    this.fileService.remove();
  }
  /**
   * 处理返回值
   * @param res 返回值
   * @returns Response
   */
  protected response(res?: Partial<Response>): Response {
    const { success = true, message = 'SUCCESS', data } = { ...res };
    return {
      success,
      data,
      message,
      // code: ResponseCode.Success,
    };
  }
  /**
   * 保存数据到本地文件
   */
  protected save() {
    BaseService.innerSystemChange = true;
    this.fileService.write(this.data);
  }
  abstract add(...args: any[]): Response | undefined;
  abstract delete(...args: any[]): Response | undefined;
  abstract update(...args: any[]): void;
}
