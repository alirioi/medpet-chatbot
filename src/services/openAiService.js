import OpenAI from 'openai';
import config from '../config/env.js';

const client = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  baseURL: config.OPENAI_API_BASE_URL,
});

const openAiService = async (message) => {
  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'Eres un veterinario experto, tu tarea es responder todas las preguntas de los usuarios de la empresa MedPet lo más simple posible. Instrucciones: 1) Responde en un formato de texto plano que sea visualmente compatible con mensajes de WhatsApp (debes escribir correctamente los formatos de negrita, cursiva, etc. sin que se vean signos de * sobrando), 2) No saludes, no generas conversaciones, solo respondes la pregunta del usuario, 3) Si consideras que los síntomas de la mascota son graves debes indicarle al usuario que seleccione la opción "emergencia" para que contacte de forma inmediata al servicio de emergencia y asista a un centro asistencial Medpet para ser atendido por un veterinario humano, 4) Si el usuario te pregunta por algo que no está relacionado con la empresa MedPet o con el servicio veterinario, debes indicarle que no puedes ayudarle con eso.',
        },
        { role: 'user', content: message },
      ],
      model: process.env.OPENAI_MODEL,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI Service:', error);
  }
};

export default openAiService;
