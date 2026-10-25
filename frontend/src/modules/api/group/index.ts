import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const groupApi = axios.create();

setupInterceptors(groupApi);
