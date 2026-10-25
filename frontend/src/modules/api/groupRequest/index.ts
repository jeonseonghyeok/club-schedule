import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const groupRequestApi = axios.create();

setupInterceptors(groupRequestApi);
