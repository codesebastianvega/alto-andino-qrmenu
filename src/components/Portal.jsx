import { createPortal } from 'react-dom';

export default function Portal({ children, targetId = 'modal-root' }) {
  const target = typeof document !== 'undefined'
    ? document.getElementById(targetId) || document.body
    : null;
  return target ? createPortal(children, target) : null;
}
