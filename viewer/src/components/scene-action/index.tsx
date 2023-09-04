import { DEFAULT_RESPONSE } from '@/constants';
import { Language, SceneInfo } from '@/interface';
import { addScene, editScene } from '@/services';
import { ButtonGroup, DialogSML, FooterActionBar, useBoolean } from '@ali/bp-materials';
import { jsonParse } from '@ali/bp-utils';
import { Balloon, Button, Drawer, Field, Form, Icon, Input, Message } from '@alifd/next';
import Editor from '@monaco-editor/react';
import jsonFormat from 'json-format';
import { forwardRef, Fragment, useEffect, useImperativeHandle, useRef } from 'react';
import styles from './index.module.scss';

export interface SceneActionProps{
  actionType?: 'add'|'edit';
  sceneInfo?: SceneInfo;
  onRefresh: () => void;
  apiId: string|undefined;
  showIcon?: boolean;
  dynamic?: boolean;
}
function SceneAction({
  actionType = 'add',
  sceneInfo: selectedScene,
  onRefresh,
  apiId,
  showIcon = true,
  dynamic,
}: SceneActionProps, ref) {
  const language: Language = dynamic ? 'javascript' : 'json';
  const refCmdDown = useRef(false);
  const refChange = useRef(false);
  const drawerVisible = useBoolean();
  const editorRef = useRef<any>();
  const field = Field.useField();
  useImperativeHandle(ref, () => ({
    show: drawerVisible.setTrue,
  }));

  function getEditorValue() {
    return editorRef.current?.getValue().replace(/[\n\t]+/g, '');
  }

  const handleEditApiScene = () => {
    const response = getEditorValue();
    if (!response) {
      Message.error('Mock数据不能为空！');
      return;
    }
    if (!jsonParse(response, { defaultValue: null })) {
      Message.error('无效的JSON格式！');
      return;
    }
    field.validate((errors, values: any) => {
      if (!errors && apiId) {
        if (actionType === 'add') {
          addScene(apiId, {
            name: values.name,
            response,
          }).then(() => {
            Message.success('数据保存成功！');
            refChange.current = false;
            drawerVisible.setFalse();
            onRefresh?.();
          });
        } else if (selectedScene && apiId) {
          const nextSceneInfo = { ...values, response };
          editScene(apiId, nextSceneInfo).then(() => {
            Message.success('数据更新成功！');
            refChange.current = false;
            onRefresh?.();
          });
        }
      }
    });
  };

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.onKeyDown((e) => {
      if (refCmdDown.current && e.keyCode === 49) {
        e.preventDefault();
        handleEditApiScene();
      }
      if (e.keyCode === 57) {
        refCmdDown.current = true;
      }
    });
    editor.onKeyUp((e) => {
      if (e.keyCode === 57) {
        refCmdDown.current = false;
      }
    });
  }

  useEffect(() => {
    if (selectedScene && drawerVisible.value) {
      field.setValues(selectedScene);
    }
  }, [selectedScene, drawerVisible.value]);


  const getFormatValue = () => {
    switch (language) {
      case 'javascript':
        return selectedScene?.response || DEFAULT_RESPONSE.JAVASCRIPT;
      default:
        return jsonFormat(selectedScene?.response || DEFAULT_RESPONSE.JSON);
    }
  };


  return (
    <Fragment>
      {showIcon &&
      <Balloon.Tooltip trigger={
        <Button text type="primary" disabled={!apiId} onClick={drawerVisible.setTrue}>
          <Icon type={actionType} />
        </Button>}
      >
        {actionType === 'add' ? '添加' : '编辑'}场景
      </Balloon.Tooltip>
      }
      <Drawer
        title={
          <Form style={{ width: 300 }} labelAlign="inset" field={field} onChange={() => { refChange.current = true; }}>
            <Form.Item required label="场景名称" name="name">
              <Input />
            </Form.Item>
          </Form>
          }
        visible={drawerVisible.value}
        onClose={() => {
          if (refChange.current) {
            DialogSML.confirm({
              title: '确认',
              content: '确认放弃更改吗？',
              onOk: () => {
                refChange.current = false;
                drawerVisible.setFalse();
              },
            });
          } else {
            drawerVisible.setFalse();
          }
        }}
        width={'65vw'}
        bodyStyle={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 100px)' }}
      >
        <div className={styles.codeEditor} style={{ flex: 1 }}>
          <Editor
            onMount={handleEditorDidMount}
            height="100%"
            language={language}
            onChange={() => { refChange.current = true; }}
            value={getFormatValue()}
          />
        </div>
        <FooterActionBar align="right">
          <ButtonGroup>
            <Button onClick={() => handleEditApiScene()}>保存</Button>
            <Button onClick={drawerVisible.setFalse}>取消</Button>
          </ButtonGroup>
        </FooterActionBar>
      </Drawer>
    </Fragment>
  );
}

export default forwardRef(SceneAction);
