import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const adminApi = axios.create();

setupInterceptors(adminApi);
