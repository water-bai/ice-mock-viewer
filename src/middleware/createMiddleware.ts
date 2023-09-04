/**
 * 参考：https://github.com/ice-lab/ice-next/blob/master/packages/ice/src/middlewares/mock/createMiddleware.ts
 */
import * as path from 'path';
import type { ExpressRequestHandler, Request, Middleware } from 'webpack-dev-server';
import { pathToRegexp } from 'path-to-regexp';
import type { Key } from 'path-to-regexp';
import createWatch from './watchSource.js';
import getConfigs, { MOCK_FILE_PATTERN } from './getConfigs.js';
import type { MockConfig } from './getConfigs.js';

function matchPath(
  req: Request,
  mockConfigs: MockConfig[],
  // @ts-ignore
): undefined | { keys: Key[]; mockConfig: MockConfig; match: RegExpExecArray } {
  for (const mockConfig of mockConfigs) {
    const keys: any[] = [];
    if (req.method.toLocaleUpperCase() === mockConfig.method) {
      const re = pathToRegexp(mockConfig.path, keys);
      const match = re.exec(req.path);
      if (match) {
        return {
          keys,
          match,
          mockConfig,
        };
      }
    }
  }
}

function decodeParam(val: any) {
  if (typeof val !== 'string' || val.length === 0) {
    return val;
  }
  try {
    return decodeURIComponent(val);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `Failed to decode param ' ${val} '`;
      (err as any).status = 400;
      (err as any).statusCode = 400;
    }
    throw err;
  }
}

interface MockOptions {
  rootDir?: string;
  exclude?: string[];
}

export default function createMockMiddleware(options: MockOptions): Middleware {
  const { exclude = [], rootDir = process.cwd() } = { ...options };
  let mockConfigs = getConfigs(rootDir, exclude);

  createWatch({
    watchDir: path.join(rootDir, 'mock'),
    watchEvents: [[MOCK_FILE_PATTERN, () => {
      mockConfigs = getConfigs(rootDir, exclude);
    }]],
  });

  // @ts-ignore
  const middleware: ExpressRequestHandler = (req, res, next) => {
    const matchResult = matchPath(req, mockConfigs);
    if (matchResult) {
      const { match, mockConfig, keys } = matchResult;
      const { handler } = mockConfig;
      if (typeof handler === 'function') {
        // params
        const params: Record<string, any> = {};
        for (let i = 1; i < match.length; i += 1) {
          const key = keys[i - 1];
          const prop = key.name;
          const val = decodeParam(match[i]);
          if (val !== undefined) {
            params[prop] = val;
          }
        }
        req.params = params;
        handler(req, res, next);
      } else {
        return res.status(200).json(handler);
      }
    } else {
      next?.();
    }
  };
  return {
    name: 'mock',
    middleware,
  };
}
