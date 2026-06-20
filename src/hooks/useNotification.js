import toast from 'react-hot-toast';

export function useNotification() {
  return {
    success: (msg) => toast.success(msg, { duration: 3000 }),
    error:   (msg) => toast.error(msg,   { duration: 4000 }),
    info:    (msg) => toast(msg,          { duration: 3000 }),
  };
}
