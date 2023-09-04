import chalk from 'chalk';
import fs from 'fs';

import { execSync, spawn } from 'child_process';
import path from 'path';

const viewerPath = path.relative(process.cwd(), './viewer');
execSync(`cd ${viewerPath}`);
const startBuild = Date.now();
if (!fs.existsSync(path.join(viewerPath, 'node_modules'))) {
  const startInstall = Date.now();
  console.log(chalk.white('🚀 viewer 开始安装依赖...\n'));
  execSync(`cd ${viewerPath} && npm install`);
  console.log(chalk.green(`✅ viewer 依赖安装完成 耗时${((Date.now() - startInstall) / 1000).toFixed(2)}ms\n`));
}

console.log(chalk.white('🚀 viewer 开始构建...\n'));
execSync(`cd ${viewerPath} && npm run build`);
console.log(chalk.green(`✅ viewer 构建成功 耗时${((Date.now() - startBuild) / 1000).toFixed(2)}ms\n`));

const copiedPath = path.join(viewerPath, 'build');
const resultPath = path.relative(process.cwd(), './public');
execSync(`rm -rf ${resultPath}`);
spawn('cp', ['-r', copiedPath, resultPath]);
console.log(chalk.green('✅ viewer 构建产物copy成功\n'));

