import React, { ReactNode } from 'react';
import Label from '../label';
import styles from './index.module.css';
import cls from 'classnames';

export interface CardProps{
  className?: string;
  children?: ReactNode;
  title?: ReactNode;
  subTitle?: ReactNode;
  help?: ReactNode;
  actionBar?: ReactNode;
}
export default function Card({ className, children, title, actionBar, help, subTitle }: CardProps) {
  return (
    <div className={cls(styles.card, className)}>
      {(title || actionBar) &&
      <div className={styles.head}>
        <div className={styles.title}>
          <Label tip={help}>{title}</Label>
          <Label className={styles.subTitle} tip={help}>{subTitle}</Label>          
        </div>
          {actionBar}
      </div>
      }
      {children}
    </div>
  );
}
