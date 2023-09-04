import ApiDetail from '@/components/api-detail';
import ApiList from '@/components/api-list';
import Card from '@/components/card';
import IconButton from '@/components/icon-button';
import VersionChecker from '@/components/version-checker';
import { APIInfo, GroupInfo, ProjectInfo, WsState, WS_STATE } from '@/interface';
import { deploy, getGroupList, getProject } from '@/services';
import { eventBus } from '@/services/ws';
import { StatusTag } from '@ali/bp-materials';
import { isIntranet } from '@ali/bp-utils';
import { Balloon, Box, Button, Icon, Message } from '@alifd/next';
import cls from 'classnames';
import { useEffect, useRef, useState } from 'react';
import styles from './index.module.scss';


export default function Home() {
  const refActiveApiId = useRef<string>();
  const [curApi, setCurApi] = useState<APIInfo>();
  const [groupList, setGroupList] = useState<GroupInfo[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>();
  const [wsState, setWsState] = useState<WsState>(WS_STATE.CONNECTED);
  const [intranet, setIntranet] = useState(false);

  function getData(activeApiId?: string) {
    refActiveApiId.current = activeApiId;
    getProject()?.then(setProjectInfo);
    getGroupList().then(setGroupList);
  }
  const handleDeploy = () => {
    deploy().then(() => {
      Message.success('Mock数据已同步至本地！');
    });
  };
  useEffect(() => {
    getData();
    const handlePageRefresh = () => {
      setWsState(WS_STATE.CONNECTED);
      getData();
    };
    const handleConnecting = () => {
      setWsState(WS_STATE.CONNECTING);
    };
    const handleConnectionClose = () => {
      setWsState(WS_STATE.CLOSED);
    };
    eventBus.on('page:refresh', handlePageRefresh);
    eventBus.on('ws:connecting', handleConnecting);
    eventBus.on('ws:closed', handleConnectionClose);

    isIntranet().then(() => setIntranet(true));


    return () => {
      eventBus.off('page:refresh', handlePageRefresh);
      eventBus.off('ws:connecting', handleConnecting);
      eventBus.off('ws:closed', handleConnectionClose);
    };
  }, []);
  useEffect(() => {
    if (groupList?.length) {
      let groupInfo: GroupInfo;
      if (refActiveApiId.current) {
        groupInfo = groupList.find(({ children }) =>
          children?.some((api) => api.uid === refActiveApiId.current)) as GroupInfo;
      } else {
        groupInfo = groupList[0];
      }
      const { uid: groupId, children = [] } = groupInfo;
      setCurApi({
        groupId,
        ...children.find((item) => item.uid === refActiveApiId.current) || children[0],
      });
      refActiveApiId.current = undefined;
    } else {
      setCurApi(undefined);
    }
  }, [groupList]);

  return (
    <div className={styles.app}>
      <Card
        title={projectInfo?.name || 'Mock项目名称'}
        subTitle={projectInfo?.description}
        actionBar={
          <div className={styles.actionBar}>
            <span >
              {wsState === WS_STATE.CLOSED && <StatusTag type="fail">服务连接已断开，请重启服务后刷新页面</StatusTag>}
              {wsState === WS_STATE.CONNECTING && <StatusTag type="pending">服务已断开，尝试重连中，请重启服务...</StatusTag>}
              {wsState === WS_STATE.CONNECTED && <StatusTag type="success">服务已连接</StatusTag>}
            </span>
            <Balloon
              closable={false}
              trigger={
                <Button
                  type="primary"
                  onClick={handleDeploy}
                >
                  <Icon type="refresh" style={{ marginRight: 12 }} /> 一键同步数据至本地
                </Button>
          }
            >
              重新生成所有接口数据至mock文件夹下
            </Balloon>
            <VersionChecker />
            <Balloon align="bl" trigger={<IconButton text icon="help">关于</IconButton>}>
              <p style={{ width: 200 }}>本地 mock 数据管理插件，提供接口分组、分场景的管理、自定义函数动态返回值(限GET请求)、实时同步数据至本地 mock 文件夹等能力，同时支持<Button text type="primary" component="a" target="_blank" href="http://mockjs.com/examples.html">Mock.js</Button>语法。</p>
              {intranet && <p>问题联系: it_baikaishui@163.com</p>}
            </Balloon>
          </div>
          }
      />
      <Box className={styles.content} spacing={12} direction="row">
        <ApiList
          groupList={groupList}
          activeUrl={curApi?.uid}
          onClick={(item) => setCurApi(item)}
          onRefresh={getData}
        />
        <Card className={cls(styles.detailContainer)} title={`${curApi?.name || ''}`} subTitle={`场景Mock数据详情${curApi?.dynamic ? '，支持自定义函数动态返回值' : ''}`} >
          <ApiDetail apiInfo={curApi} />
        </Card>
      </Box>
    </div>
  );
}
