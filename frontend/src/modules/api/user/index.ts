import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const userApi = axios.create();

setupInterceptors(userApi);
