import * as fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

export const rootDir = process.cwd();

export function createDirIfNotExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function handleResponse({ success = true, message = 'SUCCESS', data = {} } = {}) {
  return {
    success,
    data,
    message,
  };
}

export function getRootDir() {
  const filePath = fileURLToPath(import.meta.url);
  const dirname = path.resolve(path.dirname(filePath), '../../');
  return dirname;
}

export function getProjectPkgJson() {
  return JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')).toString());
}

export function getPkgJson() {
  return JSON.parse(fs.readFileSync(path.join(getRootDir(), 'package.json')).toString());
}

/**
 * 判断端口是否可用
 * @param port 端口号
 * @returns Promise<void>
 */
export function isPortValid(port: number) {
  return new Promise<boolean>((res, reject) => {
    const server = http.createServer();
    // 打开一个页面
    server.listen(port, '127.0.0.1', () => {
      server.close();
      res(true);
    });

    server.on('error', () => {
      reject();
    });
  });
}

/**
 * 获取可用的端口号
 * @param startPort 其实端口
 * @param maxTry 最大尝试次数
 * @returns Promise<number>
 */
export async function getValidPort(startPort: number, maxTry = 20): Promise<number> {
  return new Promise<number>((res, reject) => {
    if (maxTry > 0) {
      let startPortCopy = +startPort;
      isPortValid(startPortCopy).then(() => {
        res(startPortCopy);
      }).catch(() => {
        getValidPort(++startPortCopy, maxTry - 1).then(res);
      });
      return;
    }
    reject();
  });
}


/**
 * 从数组中移除
 * @param source 源数组
 * @param target 要移除的目标或者查找函数
 * @example
 * ```
 * removeFromArray([1,2,3],2);// [1,3]
 * removeFromArray([1,2,3],item=>item===2);// [1,3]
 * removeFromArray([1,2,3],2,0);// [1,0,3]
 * ```
 */
export function removeFromArray(source: any[], target: ((item: any) => boolean) | any, ...items: any[]) {
  if (source?.length) {
    const idx = typeof target === 'function' ? source.findIndex(target) : source.indexOf(target);
    if (idx >= 0) {
      source.splice(idx, 1, ...items);
    }
  }
  return source;
}
