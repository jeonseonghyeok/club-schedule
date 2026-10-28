import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const placeApi = axios.create();

setupInterceptors(placeApi);
