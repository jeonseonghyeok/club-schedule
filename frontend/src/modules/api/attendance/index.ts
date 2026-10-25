import axios from 'axios';
import { setupInterceptors } from '../setupInterceptors';

export const attendanceApi = axios.create();

setupInterceptors(attendanceApi);
