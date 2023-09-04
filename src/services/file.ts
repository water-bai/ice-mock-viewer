import fs from 'fs';
import path from 'path';
import { createDirIfNotExists } from '../utils/index.js';
import chokidar from 'chokidar';

export interface FileServiceOptions<T>{
  /**
   * 默认数据
   */
  defaultData?: T;
  /**
   * 覆盖现有数据
   */
  overwrite?: boolean;
  /**
   * 是否开启文件变更监测
   */
  watch?: boolean;
  /**
   * 监测到文件变化后的回调
   */
  onChange?: () => void;
}

export default class FileService<T = any> {
  fileName: string;
  filePath: string;
  // defaultData: T;
  // onChange?: () => void;
  options: FileServiceOptions<T>;
  constructor(filePath: string, options?: FileServiceOptions<T>) {
    this.filePath = filePath;
    this.fileName = path.parse(filePath).name;
    this.options = {
      defaultData: {} as any,
      ...options };
    this._init(this.options.overwrite);
  }


  /**
   * 读取文件
   */
  read(): T {
    const fileContent = fs.readFileSync(this.filePath, { encoding: 'utf-8' });
    if (fileContent) {
      return JSON.parse(fileContent);
    }
    return {} as any;
  }

  /**
   * 写入文件
   */
  write(data: T) {
    fs.writeFileSync(this.filePath, JSON.stringify(data));
  }

  /**
   * 移除文件
   */
  remove() {
    fs.rmSync(this.filePath);
  }

  private _watch() {
    // 监听文件变化
    const storyWatcher = chokidar.watch(this.filePath);
    storyWatcher.on('change', () => {
      this.options?.onChange?.();
    });
  }

  private _init(overwrite?: boolean) {
    const parentDir = path.dirname(this.filePath);
    createDirIfNotExists(parentDir);
    if (!fs.existsSync(this.filePath) || overwrite) { fs.writeFileSync(this.filePath, JSON.stringify(this.options.defaultData)); }
    if (this.options.watch) {
      this._watch();
    }
  }
}
