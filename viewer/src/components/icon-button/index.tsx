import { Balloon, Button, Icon } from '@alifd/next';
import { ButtonProps } from '@alifd/next/types/button';

export interface IconButtonProps extends ButtonProps{
  tip?: string;
  icon?: string;
  color?: string;
  stopPropagation?: boolean;
}
function IconButton({ tip, icon = '', children, disabled, color, style, stopPropagation, onClick, ...others }: IconButtonProps) {
  return (
    <Balloon.Tooltip
      trigger={
        <Button
          text
          size="small"
          style={{ ...style, color: disabled ? '' : color }}
          disabled={disabled}
          onClick={(e) => {
            if (stopPropagation)e.stopPropagation();
            onClick?.(e);
          }}
          {...others}
        >
          {icon && <Icon type={icon} />}
          {children && <div style={{ marginLeft: 6 }}>{children}</div>}
        </Button>
    }
    >
      {tip}
    </Balloon.Tooltip>
  );
}

export default IconButton;
