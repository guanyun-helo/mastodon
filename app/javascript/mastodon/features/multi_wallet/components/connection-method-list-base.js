import * as React from 'react';
import classNames from 'classnames';
import { ConnectionMethodButton } from './connection-method-button';
export const ConnectionMethodListBase = ({ className, methods, isMobile, keplrInstallCTAPreset, onSelectMethod, ...props }) => {
    function handleMethodSelection(method) {
        if (onSelectMethod)
            onSelectMethod(method);
    }
    return (<ul className={classNames('lk-grid lk-grid-flow-row lk-gap-[12px]', className)} {...props}>
      {methods.map(method => (<li key={method.type}>
          <ConnectionMethodButton type={method.type} name={method.name} description={method.description} url={method.url} keplrInstallCTAPreset={keplrInstallCTAPreset} isMobile={isMobile} onPress={() => handleMethodSelection(method.type)}/>
        </li>))}
    </ul>);
};
