import { addGroup } from '@/services';
import { DialogSML, useBoolean } from '@ali/bp-materials';
import { Button, Field, Form, Input, Message } from '@alifd/next';
import { Fragment } from 'react';

function GroupActionButton({ onRefresh }) {
  const dlgVisible = useBoolean();
  const field = Field.useField();
  const handleSubmit = () => {
    field.validate((errors, values: any) => {
      if (!errors) {
        addGroup(values).then(() => {
          Message.success('分组添加成功！');
          onRefresh?.();
          dlgVisible.setFalse();
        });
      }
    });
  };
  return (
    <Fragment>
      <Button size="small" type="secondary" onClick={dlgVisible.setTrue}>新建分组</Button>
      <DialogSML
        visible={dlgVisible.value}
        onCancel={dlgVisible.setFalse}
        onClose={dlgVisible.setFalse}
        size="small"
        title="新建Api分组"
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
          <Form.Item required label="分组名称" name="name">
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input />
          </Form.Item>
        </Form>
      </DialogSML>
    </Fragment>
  );
}

export default GroupActionButton;
