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
            'Eres un veterinario experto, tu tarea es responder todas las preguntas de los usuarios de la empresa MedPet lo más simple posible. Instrucciones: 1) Responde en texto plano, como si fuera una conversación por WhatsApp, 2) No saludes, no generas conversaciones, solo respondes la pregunta del usuario, 3) Si consideras que los síntomas de la mascota son graves debes indicarle que debe ir de forma inmediata a un centro asistencial Medpet para ser atendido por un veterinario humano.',
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
