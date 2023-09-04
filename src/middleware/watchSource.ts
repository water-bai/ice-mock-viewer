/**
 * 参考：https://github.com/ice-lab/ice-next/blob/master/packages/ice/src/service/watchSource.ts
 */
import * as chokidar from 'chokidar';
import micromatch from 'micromatch';
import type { WatchOptions } from 'chokidar';
import formatPath from '../utils/formatPath.js';

type EventName = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
export type WatchEvent = [
  pattern: RegExp | string,
  event: (eventName: EventName, filePath: string) => void,
  name?: string,
];

function createWatch(options: {
  watchDir: string;
  command?: string;
  watchOptions?: WatchOptions;
  watchEvents?: WatchEvent[];
}) {
  const { watchDir, command = 'start', watchOptions } = options;
  const watchEvents = options.watchEvents || [];
  // do not setup chokidar when run build
  const watcher = command === 'start' && chokidar.watch(watchDir, {
    ignoreInitial: true,
    ignored: [/node_modules/],
    ...(watchOptions || {}),
  }).on('all', (event, filePath) => {
    watchEvents.forEach(([pattern, action]) => {
      const formattedPath = formatPath(filePath);
      if (pattern instanceof RegExp && pattern.test(formattedPath)) {
        action(event, formattedPath);
      } else if (typeof pattern === 'string' && micromatch.contains(formattedPath, pattern)) {
        action(event, formattedPath);
      }
    });
  });

  return {
    watcher,
    addWatchEvent: (...args: WatchEvent[]) => {
      watchEvents.push(...args);
    },
    removeWatchEvent: (name: string) => {
      const eventIndex = watchEvents.findIndex(([,,watchName]) => watchName === name);
      watchEvents.splice(eventIndex, 1);
    },
  };
}

export default createWatch;
