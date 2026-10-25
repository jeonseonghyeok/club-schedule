import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const notificationApi = axios.create();

setupInterceptors(notificationApi);
