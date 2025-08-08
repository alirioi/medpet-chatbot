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
    if (error.response) {
      // Error recibido del servidor
      if (error.response.status === 401) {
        console.error('Error: Token vencido o inválido. Genera uno nuevo.');
      }
      console.error(
        `Error de respuesta (${error.response.status}): ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      // No hubo respuesta
      console.error(
        'No se recibió respuesta del servidor. Verifica la conexión o la URL.',
      );
    } else {
      // Error al configurar la petición
      console.error(`Error al configurar la petición: ${error.message}`);
    }
  }
};

export default sendToWhatsApp;
