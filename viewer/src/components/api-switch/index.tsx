import { LabelValueLike } from '@/interface';
import { switchApiGroup } from '@/services';
import { DialogSML, useBoolean } from '@ali/bp-materials';
import { Field, Form, Select } from '@alifd/next';
import { Fragment, useEffect } from 'react';
import IconButton from '../icon-button';

export interface ApiSwitchProps{
  apiId: string;
  curGroupId: string;
  groupList: LabelValueLike[];
  onRefresh?: () => void;
}
function ApiSwitch({ curGroupId, groupList, apiId, onRefresh }: ApiSwitchProps) {
  const dlgVisible = useBoolean();
  const field = Field.useField();
  useEffect(() => {
    if (dlgVisible.value) {
      field.setValue('groupId', curGroupId);
    }
  }, [curGroupId, dlgVisible.value]);
  return (
    <Fragment>
      <IconButton icon="switch" tip="变更分组" stopPropagation onClick={dlgVisible.setTrue} />
      <DialogSML
        size="small"
        title="变更接口分组"
        visible={dlgVisible.value}
        onClose={dlgVisible.setFalse}
        onCancel={dlgVisible.setFalse}
        onOk={() => {
          return new Promise<void>((resolve, reject) => {
            field.validate((errors, values: any) => {
              if (!errors) {
                if (curGroupId === values.groupId) { dlgVisible.setFalse(); return; }
                switchApiGroup(curGroupId, values.groupId, apiId).then(() => {
                  resolve();
                  dlgVisible.setFalse();
                  onRefresh?.();
                }).catch(reject);
              } else {
                reject();
              }
            });
          });
        }}
      >
        <Form field={field} fullWidth>
          <Form.Item label="接口分组" name="groupId">
            <Select dataSource={groupList} />
          </Form.Item>
        </Form>
      </DialogSML>
    </Fragment>
  );
}

export default ApiSwitch;
