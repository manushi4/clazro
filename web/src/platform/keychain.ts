export const setGenericPassword = async (username: string, password: string) => {
  localStorage.setItem('keychain_user', username);
  localStorage.setItem('keychain_pass', password);
  return true;
};

export const getGenericPassword = async () => {
  const username = localStorage.getItem('keychain_user');
  const password = localStorage.getItem('keychain_pass');
  if (username && password) {
    return { username, password };
  }
  return false;
};

export const resetGenericPassword = async () => {
  localStorage.removeItem('keychain_user');
  localStorage.removeItem('keychain_pass');
  return true;
};

export default {
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
};
