import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const scheduleApi = axios.create();

setupInterceptors(scheduleApi);
