export const DRAWER_OPEN  = 'DRAWER_OPEN';
export const DRAWER_CLOSE = 'DRAWER_CLOSE';

export function openDrawer(type, props) {
  return {
    type: DRAWER_OPEN,
    modalType: type,
    modalProps: props,
  };
}

export function closeDrawer(type) {
  return {
    type: DRAWER_CLOSE,
    modalType: type,
  };
}
