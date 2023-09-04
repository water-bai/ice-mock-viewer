import { EllipsisText } from '@ali/bp-materials';
import { Balloon, Icon } from '@alifd/next';
import React, { ReactNode } from 'react';
import styles from './index.module.scss';
import cls from 'classnames';

export interface LabelProps{
  tip?: ReactNode;
  tipAlign?: any ;
  children: ReactNode;
  className?: string;
}
export default function Label({ className, children, tip: help, tipAlign: helpAlign }: LabelProps) {
  return (
    <div className={cls(styles.label, className)}>
      <EllipsisText hasTooltip>{children}</EllipsisText>
      {help && <Balloon.Tooltip align={helpAlign} trigger={<Icon size="small" type="help" style={{ marginLeft: 6 }} />}>{help}</Balloon.Tooltip>}
    </div>
  );
}
