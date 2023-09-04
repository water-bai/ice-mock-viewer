import { REQUEST_METHODS, YES_NOT } from '@/constants';
import { APIInfo } from '@/interface';
import { addApi, editApi } from '@/services';
import { DialogSML, useBoolean } from '@ali/bp-materials';
import { Balloon, Button, Field, Form, Icon, Input, Message, Radio } from '@alifd/next';
import { Fragment, useEffect } from 'react';

export interface ApiActionProps{
  actionType?: 'add'|'edit'|'copy';
  defaultValue?: APIInfo;
  groupId: string;
  onRefresh: (activeAppId: string) => void;
}
const ApiAction = (({ actionType: type = 'add', defaultValue, groupId, onRefresh }: ApiActionProps) => {
  const dlgVisible = useBoolean();
  const field = Field.useField();
  useEffect(() => {
    if (defaultValue && dlgVisible.value) { field.setValues(defaultValue); }
  }, [defaultValue, dlgVisible.value]);
  const handleSubmit = () => {
    return new Promise<void>((resolve, reject) => {
      field.validate((errors, values: any) => {
        if (!errors) {
          (type !== 'edit' ? addApi : editApi)(groupId, values).then((res) => {
            resolve();
            Message.success(`API${type === 'add' ? '添加' : '更新'}成功！`);
            onRefresh?.(values.uid || res);
            dlgVisible.setFalse();
          }).catch(reject);
        }
        reject();
      });
    });
  };
  return (
    <Fragment>
      <Balloon.Tooltip trigger={
        <Button
          text
          type="primary"
          onClick={(e) => {
            e.stopPropagation();
            dlgVisible.setTrue();
          }}
        >
          <Icon type={type} />
        </Button>
        }
      >
        {
        // eslint-disable-next-line no-nested-ternary
        type === 'add' ? '新建' : type === 'copy' ? '复制' : '编辑'
        }接口
      </Balloon.Tooltip>
      <DialogSML
        visible={dlgVisible.value}
        onCancel={dlgVisible.setFalse}
        onClose={dlgVisible.setFalse}
        size="small"
        title="新建接口"
        onOk={handleSubmit}
      >
        <Form
          field={field}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
              handleSubmit();
            }
          }}
        >
          <Form.Item
            required
            label="接口路径"
            validator={(rule, value, cb) => {
              if (!/^[/]/g.test(value)) {
                cb?.("接口需要以'/'开始");
                return;
              }
              cb();
            }}
            name="name"
          >
            <Input />
          </Form.Item>
          <Form.Item required label="请求方式" name="method">
            <Radio.Group dataSource={REQUEST_METHODS} />
          </Form.Item>
          {
            field.getValue('method') === 'GET' &&
            <Form.Item label="动态接口" name="dynamic" help="通过编写自定义函数动态返回值">
              {/* @ts-ignore */}
              <Radio.Group dataSource={YES_NOT} disabled={defaultValue?.uid} />
            </Form.Item>
          }
          <Form.Item label="接口描述" name="description">
            <Input />
          </Form.Item>
        </Form>
      </DialogSML>
    </Fragment>
  );
});

export default ApiAction;
