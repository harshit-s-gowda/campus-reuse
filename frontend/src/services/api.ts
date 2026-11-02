import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1', withCredentials: true });
export const apiError = (error: unknown) => { if (axios.isAxiosError(error)) return error.response?.data?.message || 'Something went wrong'; return 'Something went wrong'; };
