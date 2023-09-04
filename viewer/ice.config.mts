import { defineConfig } from '@ice/app';
// import WebpackMockPlugin from '../src';

// The project config, see https://v3.ice.work/docs/guide/basic/config
const minify = process.env.NODE_ENV === 'production' ? 'swc' : false;
export default defineConfig(() => ({
  // Set your configs here.
  minify,
  ssg: false,
  ssr: false,
  splitChunks: false,
  webpack: (webpackConfig) => {
    // @ts-ignore
    if (process.env.NODE_ENV === 'development') {
      // 添加 webpack 插件
      // webpackConfig.plugins?.push(new WebpackMockPlugin({
      // port: 9006,
      // open: true,
      //   debug: true,
      // }));
    }
    return webpackConfig;
  },
}));
