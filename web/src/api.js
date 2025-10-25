
import axios from 'axios';
import { API_URL } from './config.js';

const API = import.meta.env.VITE_API_URL || API_URL;

export async function upload(file){
  const fd = new FormData();
  fd.append('file', file);
  const r = await axios.post(`${API}/api/upload`, fd, { headers: {'Content-Type':'multipart/form-data'} });
  return r.data;
}
export async function decorate(planUrl, textures){
  const r = await axios.post(`${API}/api/plan/decorate`, { planUrl, textures });
  return r.data;
}
export async function visualize(planUrl, rooms, textures){
  const r = await axios.post(`${API}/api/visualize`, { planUrl, rooms, textures });
  return r.data;
}
export async function queryTask(id){
  const r = await axios.get(`${API}/api/tasks/${id}`);
  return r.data;
}
