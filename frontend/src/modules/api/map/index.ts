import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const mapApi = axios.create();

setupInterceptors(mapApi);
