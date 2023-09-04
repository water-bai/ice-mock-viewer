import { EventEmitter, jsonParse, jsonStringify, logger } from '@ali/bp-utils';
import { Message } from '@alifd/next';

export const eventBus = new EventEmitter();

let repeatCount = 0;
const repeatLimit = 100;
let repeatTimer;

function connect() {
  // return {} as any;
  const _ws = new WebSocket(`ws://${location.host}`);
  if (_ws) {
    _ws.onopen = () => {
      logger.log('ws connected!');
      eventBus.emit('ws:reconnected', _ws);
      clearTimeout(repeatTimer);
      if (repeatCount > 0) {
        eventBus.emit('page:refresh');
      }
      repeatCount = 0;
    };

    _ws.onclose = () => {
      logger.warn('ws closed');
      function reconnect() {
        connect();
        eventBus.emit('ws:connecting');
        repeatCount++;
      }
      if (!repeatTimer) {
        reconnect();
      }
      repeatTimer = setTimeout(() => {
        if (repeatCount > repeatLimit) {
          clearTimeout(repeatTimer);
          eventBus.emit('ws:closed');
        } else {
          reconnect();
        }
      }, 5000);
    };

    _ws.onmessage = (ev) => {
      const { data } = ev;
      logger.success(data);
      const { api, response, action } = jsonParse(data, {});
      if (action === 'refresh') {
        eventBus.emit('page:refresh');
      } else {
        eventBus.emit(api, response);
      }
    };
    _ws.onerror = () => {
      clearTimeout(repeatTimer);
    };
  }
  return _ws;
}

let ws = connect();

eventBus.on('ws:reconnected', (res) => {
  if (ws?.readyState !== 1) { ws = res; }
});

function request<T=any>(api: string, params?: any[]) {
  return new Promise<T>((resolve, reject) => {
    function sendData() {
      if (ws) {
        const data = jsonStringify({ api, params });
        ws.send(data);
        logger.info(data);
        eventBus.on(api, (response) => {
          if (response.success) {
            resolve(response.data);
          } else {
            Message.error(response.message);
            reject();
          }
        });
      }
    }
    if (ws.readyState === ws.OPEN) {
      sendData();
    } else if (ws.readyState === ws.CONNECTING) {
      const timer = setInterval(() => {
        clearInterval(timer);
        sendData();
      }, 500);
    }
  });
}

export default request;
