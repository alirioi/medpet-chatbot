import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAiService from './openAiService.js';

class MessageHandler {
  constructor() {
    this.appointmentState = {};
    this.assistantState = {};
  }

  capitalizeFirstLetter(str) {
    if (!str) return '';
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async handleIncomingMessage(message, senderInfo) {
    const mediaKeywords = ['imagen', 'video', 'audio', 'pdf'];

    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      } else if (mediaKeywords.includes(incomingMessage)) {
        await this.sendMedia(message.from, incomingMessage);
      } else if (this.appointmentState[message.from]) {
        await this.handleAppointmentFlow(message.from, incomingMessage);
      } else if (this.assistantState[message.from]) {
        await this.handleAssistantFlow(message.from, incomingMessage);
      } else {
        const response = `Este es el *Echo* de tu mensaje:\n\n*${message.text.body}*`;
        await whatsappService.sendMessage(message.from, response);
      }
      await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
      const option = message?.interactive?.button_reply?.id;
      await this.handleMenuOption(message.from, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = [
      'hola',
      'buenos días',
      'buenas tardes',
      'buenas noches',
      'buenas',
    ];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return (
      senderInfo.profile?.name?.split(' ')[0] || senderInfo.wa_id || 'Usuario'
    );
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `¡Hola ${name}! Te damos la bienvenida a MEDPET nuestro servicio de Veterinaria Online. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = 'Elige una opción';
    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'option_1',
          title: 'Agendar cita',
        },
      },
      {
        type: 'reply',
        reply: {
          id: 'option_2',
          title: 'Hacer una consulta',
        },
      },
      {
        type: 'reply',
        reply: {
          id: 'option_3',
          title: 'Ver ubicación',
        },
      },
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option) {
    let response;

    switch (option) {
      case 'option_1':
        this.appointmentState[to] = { step: 'name' };
        response =
          'Has seleccionado *Agendar cita*. Por favor, ingresa tu nombre para comenzar el proceso de agendamiento.';
        break;
      case 'option_2':
        this.assistantState[to] = { step: 'question' };
        response =
          'Has seleccionado *Hacer una consulta*. ¿Cuál es tu consulta?';
        break;
      case 'option_3':
        response =
          'Has seleccionado *Ver ubicación*. Aquí tienes nuestra dirección: [Dirección de la veterinaria].';
        break;
      default:
        response = 'Opción no válida. Por favor, elige una opción del menú.';
    }

    await whatsappService.sendMessage(to, response);
  }

  async sendMedia(to, incomingMessage) {
    let mediaUrl, caption, type;

    switch (incomingMessage) {
      case 'imagen':
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';
        caption = '¡Esto es una imagen!';
        type = 'image';
        break;
      case 'video':
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';
        caption = '¡Esto es un video!';
        type = 'video';
        break;
      case 'audio':
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac';
        caption = '¡Esto es un audio!';
        type = 'audio';
        break;
      case 'pdf':
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';
        caption = '¡Esto es un PDF!';
        type = 'document';
        break;
      default:
        console.error('Tipo de medio no reconocido:', incomingMessage);
        break;
    }

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      new Date().toISOString(),
    ];

    appendToSheet(userData);

    return `Gracias por agendar tu cita. Nos pondremos en contacto contigo pronto para confirmar la fecha y hora de la cita.`;
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;
    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = `Gracias ${this.capitalizeFirstLetter(
          state.name,
        )}, ahora dime el nombre de tu mascota.`;
        break;

      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = `Perfecto, tu mascota se llama ${this.capitalizeFirstLetter(
          state.petName,
        )}. ¿Qué tipo de mascota es? (perro, gato, etc.)`;
        break;

      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = `Entendido, tienes un ${state.petType}. ¿Cuál es el motivo de la cita?`;
        break;

      case 'reason':
        state.reason = message;
        state.step = 'confirm';
        response = `Gracias por la información. Has solicitado una cita para tu *${
          state.petType
        }* llamado/a *${this.capitalizeFirstLetter(
          state.petName,
        )}*, por el siguiente motivo: *${
          state.reason
        }*. ¿Te gustaría confirmar la cita? (Si/No)`;
        break;

      case 'confirm':
        if (message.toLowerCase() === 'si' || message.toLowerCase() === 'sí') {
          response = this.completeAppointment(to);
        } else {
          response = `Cita cancelada. Si necesitas ayuda con algo más, no dudes en preguntar.`;
          delete this.appointmentState[to];
        }
        break;
    }

    await whatsappService.sendMessage(to, response);
  }

  async handleAssistantFlow(to, message) {
    const state = this.assistantState[to];
    let response;

    const menuMessage = '¿La respuesta fue útil?';
    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'option_4',
          title: 'Si, gracias',
        },
      },
      {
        type: 'reply',
        reply: {
          id: 'option_5',
          title: 'Hacer otra pregunta',
        },
      },
      {
        type: 'reply',
        reply: {
          id: 'option_6',
          title: 'Emergencia',
        },
      },
    ];

    if (state.step === 'question') {
      response = await openAiService(message);
    }

    delete this.assistantState[to];
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }
}

export default new MessageHandler();
