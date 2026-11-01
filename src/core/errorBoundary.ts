/** Fixed codes only: exception messages, URLs and rejection reasons are never rendered or sent. */
export function installErrorBoundary(report: (code: 'runtime_error') => void, recover: () => void) {
  let showing = false;
  const handle = () => {
    report('runtime_error');
    if (!showing) {
      showing = true;
      recover();
    }
  };
  window.addEventListener('error', handle);
  window.addEventListener('unhandledrejection', handle);
  return () => {
    window.removeEventListener('error', handle);
    window.removeEventListener('unhandledrejection', handle);
  };
}
