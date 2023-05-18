import React from 'react';
import { Dialog as DialogBase, DialogBody } from '@blueprintjs/core';
export const Dialog = ({ isOpen = false, children, onClose = () => {} }) => {
  return (
    <DialogBase
      isOpen={isOpen}
      className="lk-relative lk-z-[9999]"
      onClose={onClose}
    >
      <div
        className="lk-fixed lk-inset-0 lk-bg-[black]/30"
        aria-hidden="true"
      />
      <div className="lk-fixed lk-inset-0 lk-overflow-y-auto">
        <div className="lk-flex lk-items-center lk-justify-center lk-min-h-screen lk-px-[12px] sm:lk-px-[24px] lk-py-[24px] ">
          <DialogBody className="lk-mx-auto lk-max-w-[400px] lk-w-full lk-drop-shadow-xl">
            <div>
              <button
                className="lk-text-[#28646e] lk-bg-[#ebebeb] hover:lk-bg-[#e6e6e6] active:lk-bg-[#9b9b9b] lk-transition-colors lk-rounded-full lk-flex lk-justify-center lk-items-center p-[14px] lk-w-[48px] lk-h-[48px]"
                onClick={onClose}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.8383 3.74744C15.2289 3.35691 15.862 3.35691 16.2525 3.74744C16.6431 4.13796 16.6431 4.77113 16.2525 5.16165L11.4142 10L16.2525 14.8383C16.6431 15.2289 16.6431 15.862 16.2525 16.2526C15.862 16.6431 15.2289 16.6431 14.8383 16.2526L9.99998 11.4142L5.16164 16.2526C4.77111 16.6431 4.13795 16.6431 3.74742 16.2526C3.3569 15.862 3.3569 15.2289 3.74742 14.8383L8.58577 10L3.74742 5.16165C3.3569 4.77113 3.3569 4.13796 3.74742 3.74744C4.13795 3.35691 4.77111 3.35691 5.16164 3.74744L9.99998 8.58578L14.8383 3.74744Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
            <div className="lk-py-[24px] sm:lk-py-[32px] lk-px-[16px] sm:lk-px-[24px] lk-rounded-[16px] sm:lk-rounded-[24px] lk-bg-[#fff] lk-mt-[8px]">
              {children}
            </div>
          </DialogBody>
        </div>
      </div>
    </DialogBase>
  );
};
