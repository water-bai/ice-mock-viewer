
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
// import fs from 'fs';
import path from 'path';
import sirv from 'sirv';
import openBrowser from './utils/openBrowser.js';
import chalk from 'chalk';
import { getRootDir, getValidPort, handleResponse } from './utils/index.js';
import APIService from './services/api.js';
import SceneService from './services/scene.js';
import { projectService, groupService, bindFileChangeCallback } from './services/index.js';

import createMockMiddleware from './middleware/createMiddleware.js';

export { createMockMiddleware };

export type ServiceModule = 'project'|'group'|'api'|'scene';
// export type ServiceAction = 'add'|'delete'|'update'|'get'|'getList'|'deploy'|'checkVersion';

export interface WebpackMockViewerOptions{
  /**
   * 是否开启debug模式，设置true打印消息日志
   * @default false
   */
  debug: boolean;
  /**
   * 是否在启动时打开mock 数据管理页面
   * @default false
   */
  open: false;
  /**
   * mock后台通信服务端口
   * @default 9005
   */
  port: number;
}


export default class WebpackMockViewer {
  options;
  apiServiceMap: Record<string, APIService>={};
  sceneServiceMap: Record<string, SceneService>={};
  started=false;
  constructor(options?: Partial<WebpackMockViewerOptions>) {
    this.options = {
      debug: false,
      open: false,
      port: 9005,
      ...options,
    };
  }
  apply(compiler: any) {
    compiler.hooks.done.tapAsync(
      'MockPlugin',
      (s: any, cb: () => void) => {
        if (!this.started) { this.startServer(); } else { this._logMockUrl(); }
        cb();
      },
    );
  }

  async startServer() {
    const { open, debug } = this.options;

    const sirvServer = sirv(path.resolve(getRootDir(), './public'));
    // @ts-ignore
    const server = http.createServer(sirvServer, { dev: true });

    const validPort = await this._getValidPort();
    // 打开一个页面
    server.listen(validPort, '127.0.0.1', () => {
      if (open) { openBrowser(this._getMockUrl()); }
      this._logMockUrl();
    });

    // 读取数据

    const ws = new WebSocketServer({ server });

    ws.on('connection', (wss: WebSocket) => {
      console.log(chalk.green('\nMock ws connected!\n'));
      // 绑定文件变更监听后的回调
      bindFileChangeCallback(() => {
        wss.send(JSON.stringify({
          action: 'refresh',
        }));
      });
      wss.on('message', (data: ArrayBuffer[]) => {
        if (debug) { console.log('← ', data.toString()); }
        let response;
        const { api, params = [] }: {api: string;params: any[]} = JSON.parse(data.toString());
        try {
          const [serviceName, action] = api.split('/').filter((item: string) => !!item) as [ServiceModule, string];
          switch (serviceName) {
            case 'project':
            // @ts-ignore
              response = projectService[action].apply(projectService, ...params);
              break;
            case 'group':
            // @ts-ignore
              response = groupService[action].call(groupService, params[0]);
              break;
            case 'api': {
              const [groupId, ...others] = params;
              if (!this.apiServiceMap[groupId]) { this.apiServiceMap[groupId] = new APIService(groupId); }
              // @ts-ignore
              response = this.apiServiceMap[groupId][action].apply(this.apiServiceMap[groupId], others);
              break;
            }
            case 'scene': {
              const [apiId, ...others] = params;
              if (!this.sceneServiceMap[apiId]) { this.sceneServiceMap[apiId] = new SceneService(apiId); }
              // @ts-ignore
              response = this.sceneServiceMap[apiId][action].apply(this.sceneServiceMap[apiId], others);
              break;
            }
            default:
              console.error(chalk.red(`\ninvalid api: ${api}`));
          }
        } catch (ex) {
          console.error(ex);
          response = handleResponse({ success: false, message: '系统异常' });
        }

        const res = JSON.stringify({ api, response: response || handleResponse() });
        if (debug) console.log('→ ', res);
        wss.send(res);
      });
    });
    this.started = true;
  }
  private _getMockUrl() {
    const { port } = this.options;
    return `http://127.0.0.1:${port}`;
  }
  private _logMockUrl() {
    const mockServiceUrl = this._getMockUrl();
    console.log(`${chalk.green('\nMock服务地址：')}${chalk.underline.white(mockServiceUrl)}\n`);
  }
  private async _getValidPort(): Promise<number|undefined> {
    const { port } = this.options;
    const validPort = await getValidPort(port);
    if (!validPort) throw new Error(`\nERROR 端口(${port})被占用，自动切换端口失败！`);
    if (validPort !== port) {
      console.log(chalk.bgBlue('\nINFO '), chalk.blue(`端口(${port})被占用，已自动切换端口为(${validPort})`));
      this.options.port = validPort;
    }
    return validPort;
  }
}
