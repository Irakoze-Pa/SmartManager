export const notifySuccess = (message: string): void => {
  window.dispatchEvent(new CustomEvent('smartshop:success', { detail: message }));
  window.dispatchEvent(new Event('smartshop:workspace-updated'));
};
