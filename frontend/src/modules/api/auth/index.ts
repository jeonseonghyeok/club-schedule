import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const authApi = axios.create();

setupInterceptors(authApi);
