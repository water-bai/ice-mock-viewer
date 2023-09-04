# ice-mock-viewer

本地 mock 数据管理 webpack 插件。ice 提供了[本地 mock 方案](https://v3.ice.work/docs/guide/basic/mock)，但是 对于本地 mock 数据的编辑、管理却很不方便，因此开发了本插件。通过本插件可以启动一个本地 mock 数据管理页面，并提供了接口分组、分场景的管理、实时同步数据至本地 mock 文件夹等能力，同时支持[Mock.js](https://github.com/nuysoft/Mock)语法。

## Install

```bash
$ npm i ice-mock-viewer -D
```

## Usage

### 配置

#### ice3 插件

> 如果该包@ice/plugin-mock-viewer 安装失败的话，请忽略该方式，使用其他方式。

```js
// ice.config.mts
import { defineConfig } from "@ice/app";
import mockViewer from "@ice/plugin-mock-viewer";

export default defineConfig(() => ({
  // Set your configs here.
  mockViewer({
    // port: 9006, // 可以自定义端口
    // open: true, // 启动是打开mock数据管理页面
    // debug: true, // 打印消息通信日志
  })

}));
```

#### ice3 webpack 配置

```js
// ice.config.mts
import { defineConfig } from "@ice/app";
import WebpackMockViewer from "ice-mock-viewer";

export default defineConfig(() => ({
  // Set your configs here.
  minify,
  ssg: false,
  ssr: false,
  splitChunks: false,
  webpack: (webpackConfig) => {
    if (process.env.NODE_ENV === "development") {
      // 添加 webpack 插件
      webpackConfig.plugins?.push(
        new WebpackMockViewer({
          // port: 9006, // 可以自定义端口
          // open: true, // 启动是打开mock数据管理页面
          // debug: true, // 打印消息通信日志
        })
      );
    }
    return webpackConfig;
  },
}));
```

#### 其他基于 build.json 的配置

```js
// local.plugin.js
module.exports = function ({ context, onGetWebpackConfig }) {
  onGetWebpackConfig(async (config) => {
    if (context.command === "start") {
      // 由于mock-viewer插件是node es module，需要使用动态import()形式加载
      const { default: WebpackMockViewer } = await import(
        "ice-mock-viewer"
      );
      config.plugin("mock-viewer").use(WebpackMockViewer, [
        {
          // port: 9006, // 可以自定义端口
          // open: true, // 启动是打开mock数据管理页面
          // debug: true, // 打印消息通信日志
        },
      ]);
    }
  });
};
```

```json
// build.json
{
  "plugins": ["./plugins/custom.js"]
}
```

#### 自定义 webpack v4 配置

如果是 webpack 自定义配置，默认是不支持解析 mock 文件下的接口数据的，需要通过 devServer middleware 来获取该能力，具体配置如下。

```js
// webpack.config.js
const DEV = true; // 自定义是否为本地开发模式
const config = {
  // 其他配置
};
module.exports = async () => {
  if (DEV) {
    // 由于mock-viewer插件是node es module，需要使用动态import()形式加载
    const { default: WebpackMockViewer, createMockMiddleware } = await import(
      "ice-mock-viewer"
    );
    // 添加 webpack 插件
    config.plugins.push(
      new WebpackMockViewer({
        // port: 9006, // 可以自定义端口
        // open: true, // 启动是打开mock数据管理页面
        // debug: true, // 打印消息通信日志
      })
    );
    config.devServer.after = function (app, devServer) {
      app.use(
        createMockMiddleware({
          // 忽略 mock 目录中 custom 目录下的文件以及 api.ts 文件
          // exclude: ["custom/**", "api.ts"],
        }).middleware
      );
    };
  }
  return config;
};
```

#### webpack v5 配置

待补充

### 运行

配置好之后，执行`npm run start`命令，控制台会打印 Mock 页面的地址，或者配置`open:true`直接打开页面。

demo 页面如下：
<img src='https://img.alicdn.com/imgextra/i4/O1CN01XzO6O01Tnc4DLj7C7_!!6000000002427-0-tps-1919-976.jpg'/>

### 访问 mock 接口

通过`{location.origin}{apiUrl}`来访问 mock 接口数据，如过有一个路径为`/api/test`的 mock 接口，那么可以通过[http://localhost:3000/api/test](http://localhost:3000/api/test)访问 mock 数据。

### 自定义响应函数

- 新建接口时选择【动态接口】

<img src='https://img.alicdn.com/imgextra/i2/O1CN01W2iwv61k48Cp7RAac_!!6000000004629-0-tps-423-490.jpg' />

- 根据请求参数，自定义响应函数

<img src='https://img.alicdn.com/imgextra/i1/O1CN013HOvZe1aSGvOVHbJv_!!6000000003328-0-tps-543-423.jpg' />
