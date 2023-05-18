import * as React from 'react';
import { Collapse, Button,Callout } from '@blueprintjs/core';
import classNames from 'classnames';
import { ConnectionMethodListBase } from './connection-method-list-base';
import ExpandMoreIcon from './icons/expand-more';

export const ConnectionMethodList = ({
  className,
  isCollapsible = false,
  collapsibleToggleButtonTitle = 'Expand',
  ...props
}) => {
  if (!isCollapsible) {
    return <ConnectionMethodListBase className={className} {...props} />;
  }
  return (
    <Collapse>
      {({ open }) => (
        <>
          <Button
            className={classNames(
              'lk-flex lk-justify-center lk-items-center lk-gap-[8px] lk-text-center lk-mt-[12px] lk-text-[12px] lk-leading-[5/3] hover:lk-bg-[#f7f7f7] active:lk-bg-[#ebebeb] lk-transition-colors lk-rounded-[8px] lk-w-full lk-p-[4px]',
              className,
            )}
          >
            <span>{collapsibleToggleButtonTitle}</span>
            <ExpandMoreIcon
              className={classNames(
                'lk-w-[20px] lk-h-[20px] lk-transition-transform',
                { 'lk-rotate-180': open },
              )}
            />
          </Button>
          <Callout>
            <ConnectionMethodListBase className='lk-mt-[8px]' {...props} />
          </Callout>
        </>
      )}
    </Collapse>
  );
};
