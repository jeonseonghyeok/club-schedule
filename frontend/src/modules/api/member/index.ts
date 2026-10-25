import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const memberApi = axios.create();

setupInterceptors(memberApi);
