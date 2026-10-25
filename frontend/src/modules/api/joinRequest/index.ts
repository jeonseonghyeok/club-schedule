import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const joinRequestApi = axios.create();

setupInterceptors(joinRequestApi);
