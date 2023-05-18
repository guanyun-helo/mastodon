import classNames from 'classnames';
import React from 'react';
import AlertIcon from './icons/alert';
export const Alert = ({ children, className, isPlain = false, ...props }) => {
    return (<div className={classNames('lk-flex lk-items-start lk-flex lk-text-gray-dark lk-leading-[24px] lk-text-[14px]', { 'lk-p-[16px] lk-rounded-[24px] lk-bg-gray-lightest': !isPlain }, className)} {...props}>
      <AlertIcon className="lk-shrink-0 lk-w-[16px] lk-h-[24px] lk-w-[16px] lk-mr-[8px]"/>
      {children}
    </div>);
};
