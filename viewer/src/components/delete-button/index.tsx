import { DialogSML } from '@ali/bp-materials';
import { ReactNode } from 'react';
import IconButton from '../icon-button';

export interface DeleteButtonProps{
  title?: string;
  subTitle?: string;
  children?: ReactNode;
  tip?: string;
  onOk: () => void;
}
function DeleteButton({ title = '删除', tip, subTitle = '确认删除当前数据吗？', children, onOk }: DeleteButtonProps) {
  return (
    <IconButton
      tip={tip || title}
      icon="ashbin"
      color="orangered"
      onClick={(e) => {
        e.stopPropagation();
        DialogSML.confirm({
          title,
          content: subTitle,
          onOk,
        });
      }}
    >{children}
    </IconButton>
  );
}

export default DeleteButton;
