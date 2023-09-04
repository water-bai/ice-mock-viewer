import { APIInfo, GroupInfo } from '@/interface';
import { deleteApi, deleteGroup } from '@/services';
import { ButtonGroup, EllipsisText, EmptyContent, StatusTag } from '@ali/bp-materials';
import { Collapse, List, Message, Search } from '@alifd/next';
import cls from 'classnames';
import { Fragment, useEffect, useState } from 'react';
import ApiAction from '../api-action';
import Card from '../card';
import DeleteButton from '../delete-button';
import GroupActionButton from '../group-action';
import Label from '../label';
import styles from './index.module.scss';
import debounce from 'lodash.debounce';
import ApiSwitch from '../api-switch';

export interface ApiListProps{
  groupList: GroupInfo[];
  activeUrl?: string;
  onClick: (item: APIInfo) => void;
  onRefresh: (activeApiId?: string) => void;
}

const METHOD_STATUS = {
  GET: 'pending',
  POST: 'success',
};
function ApiList({ groupList = [], activeUrl: activeKey, onClick, onRefresh }: ApiListProps) {
  const [dataSource, setDataSource] = useState(groupList);
  const handleDeleteGroup = (groupId: string) => {
    deleteGroup(groupId).then(() => {
      Message.success('分组删除成功！');
      onRefresh?.();
    });
  };
  const handleSearch = debounce((str = '') => {
    if (str) {
      const nextGroupList = groupList.map((group) => {
        return {
          ...group,
          children: group.children?.filter((item) => item.name.toLocaleLowerCase().includes(str.toLocaleLowerCase())),
        };
      });
      setDataSource(nextGroupList);
    } else {
      setDataSource(groupList);
    }
  }, 300);
  useEffect(() => {
    if (groupList.length)setDataSource(groupList);
  }, [groupList]);
  return (
    <Card
      className={styles.appList}
      title="API列表"
      actionBar={
        <Fragment>
          <Search placeholder="请输入接口路径" hasClear shape="simple" style={{ marginRight: 6, maxWidth: 200 }} onChange={handleSearch} />
          <GroupActionButton onRefresh={onRefresh} />
        </Fragment>
        }
    >
      <div className={styles.content} >
        { dataSource.length > 0 ?
          <Collapse defaultExpandedKeys={[dataSource[0].uid]}>
            {
            dataSource.map(({ name: groupName, description, uid: groupId, children = [] }) => {
              return (
                <Collapse.Panel
                  title={
                    <div className={styles.groupTitle}>
                      <Label tip={description || groupName}>{groupName} ({children.length})</Label>
                      <ButtonGroup>
                        <ApiAction groupId={groupId} onRefresh={onRefresh} />
                        <DeleteButton
                          title="删除分组"
                          subTitle="确认删除当前分组及分组下所有接口吗？"
                          onOk={() => handleDeleteGroup(groupId)}
                        />
                      </ButtonGroup>
                    </div>
                    }
                  key={groupId}
                >
                  <List
                    dataSource={children}
                    renderItem={(item: APIInfo) => {
                      const md = item.method.toUpperCase();
                      const paths = item.name.split('/').filter((p) => !!p);
                      let apiTitle = item.name;
                      if (paths.length > 2) {
                        apiTitle = `/${paths.shift()}/.../${paths.pop()}`;
                      }
                      return (
                        <List.Item
                          className={cls({ active: item.uid === activeKey })}
                          key={item.uid}
                          title={<Label>{apiTitle}</Label>}
                          onClick={() => onClick({ ...item, groupId })}
                          extra={
                            <div className={styles.apiExtra}>
                              <div>
                                {item.dynamic && <StatusTag style={{ minWidth: 'quto', marginRight: 3 }} type="underway">动态</StatusTag>}
                                <StatusTag style={{ minWidth: 'quto' }} type={METHOD_STATUS[md]}>{md}</StatusTag>
                              </div>
                              <ButtonGroup className={styles.apiActionBar} text primary maxInline={3} foldButtonText="">
                                <ApiAction actionType="edit" defaultValue={item} groupId={groupId} onRefresh={onRefresh} />
                                <ApiAction actionType="copy" defaultValue={{ ...item, uid: '' }} groupId={groupId} onRefresh={onRefresh} />
                                <ApiSwitch curGroupId={groupId} groupList={groupList.map((g) => ({ label: g.name, value: g.uid }))} apiId={item.uid} onRefresh={onRefresh} />
                                <DeleteButton
                                  title="删除接口"
                                  subTitle={'确认删除当前接口及接口下所有场景吗？'}
                                  onOk={() => {
                                    deleteApi(groupId, item.uid).then(() => {
                                      Message.success('接口已删除！');
                                      onRefresh?.();
                                    });
                                  }}
                                />
                              </ButtonGroup>
                            </div>
                            }
                        >
                          <EllipsisText hasTooltip>{item.description}</EllipsisText>
                        </List.Item>
                      );
                    }}
                  />
                </Collapse.Panel>
              );
            })
          }
          </Collapse> :
          <EmptyContent level="page" subTitle="暂无API，快去新建吧" />
          }
      </div>
    </Card>
  );
}

export default ApiList;
