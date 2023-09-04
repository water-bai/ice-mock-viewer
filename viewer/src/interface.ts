
export interface DataItem<T=any>{
  uid: string;
  name: string;
  description?: string;
  children?: T[];
}

export type GroupInfo = DataItem<APIInfo>;
export interface LabelValueLike{
  label: string;
  value: any;
  [key: string]: any;
}

export interface APIInfo extends DataItem<SceneInfo>{
  groupId?: string;
  method: 'POST'|'GET';
  dynamic?: boolean;
}
export interface SceneInfo extends DataItem{
  response: string;
  active?: boolean;
}

export interface ProjectInfo{
  name: string;
  description: string;
}


export const WS_STATE = {
  CONNECTING: 0,
  CONNECTED: 1,
  CLOSED: -1,
} as const;

export type WsState =typeof WS_STATE[ keyof typeof WS_STATE];


export type Language = 'json'|'javascript';
