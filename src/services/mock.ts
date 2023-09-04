import path from 'path';
import fs from 'fs';
import { APIInfo } from './api.js';
import SceneService from './scene.js';
import glob from 'glob';

const rootDir = process.cwd();

export default class MockService {
  mockDir = path.join(rootDir, 'mock');
  constructor() {
    this._init();
  }

  remove() {
    fs.rmSync(this.mockDir, { force: true, recursive: true });
    this._init();
  }

  delete(apiId: string) {
    const fileName = glob.sync(`mock/${apiId}-*`, { root: this.mockDir })[0];
    if (fileName) {
      fs.rmSync(fileName);
    }
  }

  write({ method, name, uid, dynamic }: APIInfo) {
    const apiFileName = name.split('/').filter((item) => item).join('-');
    const filePath = path.join(this.mockDir, `${uid}-${apiFileName}.js`);
    const { data: { valueMap, activeSceneId } } = new SceneService(uid).get();
    if (activeSceneId) {
      const activeScene = valueMap[activeSceneId];
      const response = !dynamic ? `(req, res) => {
        const result = Mock.mock(${activeScene.response});
        res.send(result);
      },` : activeScene.response;
      if (activeScene) {
        fs.writeFileSync(filePath, `
// 由ice-mock-viewer自动生成，请勿编辑
import Mock from 'mockjs';

export default {
  '${method} ${name}': ${response}
};
`);
      }
    }
  }
  private _init() {
    if (!fs.existsSync(this.mockDir)) {
      fs.mkdirSync(this.mockDir);
    }
    this._addReadme();
  }

  private _addReadme() {
    const readmePath = path.join(this.mockDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      const readmeText = `注意！！！注意！！！注意！！！

- 当前文件夹下的内容为 [icejs 本地接口 mock 服务](https://ice3.alibaba-inc.com/v3/docs/guide/basic/mock)所需的数据
- 由[ice-mock-viewer](https://npm.alibaba-inc.com/package/ice-mock-viewer)插件自动生成，请勿编辑;
- 请将该文件夹添加到.gitignore 中，无需上传远程 git 仓库;
`;
      fs.writeFileSync(readmePath, readmeText);
    }
  }
}
