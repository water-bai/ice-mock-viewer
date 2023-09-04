import { APIInfo, Language, SceneInfo } from '@/interface';
import { deleteScene, editScene as updateScene, getSceneList, switchActiveScene } from '@/services';
import { ButtonGroup, Dialog, useBoolean } from '@ali/bp-materials';
import { jsonParse } from '@ali/bp-utils';
import { Box, Button, Input, List, Message, Select, Loading } from '@alifd/next';
import cls from 'classnames';
import jsonFormat from 'json-format';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import CodeEditor from '../code-editor';
import DeleteButton from '../delete-button';
import IconButton from '../icon-button';
import Label from '../label';
import SceneAction from '../scene-action';
import debounce from 'lodash.debounce';
import styles from './index.module.scss';

export interface ApiDetailProps{
  apiInfo: APIInfo|undefined;
}
function ApiDetail({ apiInfo }: ApiDetailProps) {
  const { uid: apiId, groupId, dynamic } = { ...apiInfo };
  const language: Language = dynamic ? 'javascript' : 'json';
  // 场景数组
  const [sceneList, setSceneList] = useState<SceneInfo[]>([]);
  // 编辑器组件引用
  const refEditor = useRef<any>();
  // 当前选择的场景
  const [selectedScene, setSelectedScene] = useState<SceneInfo>();
  const refSelectedScene = useRef<SceneInfo>();
  // 生效的场景ID
  const [activeSceneId, setActiveSceneId] = useState<string>();
  // 当前编辑的场景
  const [editScene, setEditScene] = useState<SceneInfo>();
  // 当前编辑的场景mock数据
  const [editSceneResponse, setEditSceneResponse] = useState<string>();
  // 是否应该更新场景数据
  const shouldChangeEditSceneResponse = useRef(true);
  const loading = useBoolean();

  const getData = useCallback(() => {
    if (apiId) {
      loading.setTrue();
      getSceneList(apiId).then((list = []) => {
        const active = list.find((item) => item.active === true);
        if (active) {
          setActiveSceneId(active.uid);
        }

        setSelectedScene((pre) => {
          let nextSelected;
          // 保持之前选中的场景
          if (pre) {
            nextSelected = list.find((item) => item.uid === pre.uid) as SceneInfo;
          }
          return nextSelected || active || list[0] || {};
        });
        setSceneList(list);
        loading.setFalse();
      }).catch(loading.setFalse);
    }
  }, [apiId]);

  useEffect(() => {
    // setSelectedScene生效后再请求数据
    setTimeout(() => {
      shouldChangeEditSceneResponse.current = true;
      getData();
    }, 100);
    return () => {
      setActiveSceneId(undefined);
      setSelectedScene(undefined);
      setEditScene(undefined);
      setEditSceneResponse(undefined);
      setSceneList([]);
    };
  }, [getData]);

  useEffect(() => {
    refSelectedScene.current = selectedScene;
  }, [selectedScene]);


  const handleChangeSelectedScene = (item) => {
    if (editScene || editSceneResponse) {
      Dialog.confirm({
        title: '确认',
        content: '确认放弃更改吗？',
        onOk: () => {
          shouldChangeEditSceneResponse.current = false;
          setEditScene(undefined);
          setEditSceneResponse(undefined);
          setSelectedScene(item);
        },
      });
    } else if (selectedScene?.uid !== item.uid) {
      shouldChangeEditSceneResponse.current = false;
      setSelectedScene(item);
    }
  };

  // 切换剩下场景
  const handleSwitchActiveScene = (sceneId: string) => {
    if (apiId && groupId) {
      setActiveSceneId(sceneId);

      handleChangeSelectedScene(sceneList.find((item) => item.uid === sceneId));

      switchActiveScene(apiId, sceneId).then(() => {
        Message.success('生效场景切换成功！');
      });
    }
  };

  const handleUpdateSceneName = () => {
    // 更新场景名
    if (editScene?.name) {
      updateScene(apiId as string, editScene).then(() => {
        Message.success('场景名更新成功！');
        setEditScene(undefined);
        getData();
      });
    }
  };
  const handleUpdateSceneResponse = () => {
    const sceneInfo = refSelectedScene.current;
    const response = refEditor.current?.getValue();
    if (!response) {
      Message.error('Mock数据不能为空！');
      return;
    }


    if (language === 'json' && !jsonParse(response, { defaultValue: null })) {
      Message.error('无效的JSON格式！');
      return;
    } else if (language === 'javascript') {
      try {
        // eslint-disable-next-line no-eval
        eval(response);
      } catch {
        Message.error('代码存在语法错误，请检查！');
        return;
      }
    }
    // 更新场景名
    if (sceneInfo?.name) {
      updateScene(apiId as string, { ...sceneInfo, response }).then(() => {
        Message.success('场景数据更新成功！');
        setEditSceneResponse(undefined);
        setTimeout(() => {
          getData();
        }, 100);
      });
    }
  };

  const renderApiSceneItem = (item: SceneInfo) => {
    const editing = editScene?.uid === item.uid;
    const isActive = activeSceneId === item.uid;
    return (
      <List.Item
        key={item.name}
        className={cls({
          active: item.uid === selectedScene?.uid,
          selected: item.uid === activeSceneId,
        })}
        onDoubleClick={(e) => {
          editScene ? e.stopPropagation() : setEditScene(item);
        }}
        title={
          <div
            onClick={(e) => editScene && e.stopPropagation()}
          >
            {isActive && <div className={styles.activeBadge}>生效</div>}
            { editing ?
              <Input
                value={editScene.name}
                onPressEnter={handleUpdateSceneName}
                onChange={(v) => {
                  setEditScene((pre: any) => ({
                    ...pre,
                    name: v,
                  }));
                }}
              /> :
              <Label>{item.name}</Label>
          }
          </div>
        }
        extra={
          <div onClick={(e) => editScene && e.stopPropagation()}>
            <ButtonGroup text size="small">
              {editing ?
                <Fragment>
                  <IconButton
                    icon="select"
                    tip="保存"
                    disabled={!editScene.name}
                    color="forestgreen"
                    onClick={handleUpdateSceneName}
                  />
                  <IconButton icon="close" color="orangered" onClick={() => setEditScene(undefined)} tip="取消" />
                </Fragment> :
                <Fragment>
                  <IconButton disabled={!editing && !!editScene} icon="edit" tip="编辑场景名称" onClick={() => setEditScene(item)} />
                  <DeleteButton
                    title="删除场景"
                    subTitle={`确认删除场景${item.name}吗？`}
                    onOk={() => {
                      if (apiId) {
                        deleteScene(apiId, item.uid).then(() => {
                          if (selectedScene?.uid === item.uid) {
                            setSelectedScene(undefined);
                          }
                          Message.success('场景数据已删除！');
                          getData();
                        });
                      }
                    }}
                  />
                </Fragment>}
            </ButtonGroup>
          </div>
        }
        onClick={() => handleChangeSelectedScene(item)}
      />
    );
  };
  return (
    <Box className={styles.apiDetail} direction="row">
      <Loading visible={loading.value}>
        <List
          header={
            <div className={styles.listHeader}>
              <Select
                label="切换场景"
                value={activeSceneId}
                dataSource={sceneList.map((item) => {
                  return { label: item.name, value: item.uid };
                })}
                onChange={handleSwitchActiveScene}
                style={{ width: '100%' }}
              />
              <SceneAction onRefresh={getData} dynamic={dynamic} apiId={apiId} />
            </div>
            }
          size="small"
          dataSource={sceneList}
          renderItem={renderApiSceneItem}
        />
        <div className={styles.codeEditor}>

          <div className={styles.actionBar} >
            <ButtonGroup text forceStandardStyle={false}>
              <Button component="a" target="_blank" href="http://mockjs.com/examples.html">Mock.js 文档</Button>
              {editSceneResponse && <IconButton type="secondary" tip="保存(⌘ + S)" icon="select" text={false} onClick={handleUpdateSceneResponse} >保存((⌘ + S))</IconButton>}
            </ButtonGroup>
          </div>
          {selectedScene &&
          <CodeEditor
            ref={refEditor}
            onSave={handleUpdateSceneResponse}
            onChange={debounce((v) => {
              if (v) {
                if (v === selectedScene.response) {
                  setEditSceneResponse(undefined);
                } else if (shouldChangeEditSceneResponse.current) {
                  setEditSceneResponse(() => {
                    return v;
                  });
                }
              }
              shouldChangeEditSceneResponse.current = true;
            }, 200)}
            height={850}
            language={language}
            value={language === 'json' ? jsonFormat(jsonParse(selectedScene.response as any)) : selectedScene.response}
            options={{ readOnly: !!editScene }}
          />}
        </div>

      </Loading>
    </Box>

  );
}

export default ApiDetail;
