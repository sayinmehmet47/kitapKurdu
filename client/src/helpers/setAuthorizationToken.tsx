import axios from 'axios';

export const setAuthorizationToken = (token: any) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else delete axios.defaults.headers.common['Authorization'];
};
