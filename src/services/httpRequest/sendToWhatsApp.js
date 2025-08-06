import axios from 'axios';
import config from '../../config/env.js';

const axiosInstance = axios.create({
  baseURL: `${config.WHATSAPP_API_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}`,
  headers: {
    Authorization: `Bearer ${config.API_TOKEN}`,
  },
});

const sendToWhatsApp = async (data) => {
  try {
    const response = await axiosInstance.post('/messages', data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export default sendToWhatsApp;
