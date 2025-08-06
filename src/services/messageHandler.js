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
        await this.sendWelcomeMessage(message.from, senderInfo);
        await this.sendWelcomeMenu(message.from);
      } else if (mediaKeywords.includes(incomingMessage)) {
        await this.sendMedia(message.from, incomingMessage);
      } else if (this.appointmentState[message.from]) {
        await this.handleAppointmentFlow(message.from, incomingMessage);
      } else if (this.assistantState[message.from]) {
        await this.handleAssistantFlow(message.from, incomingMessage);
      } else {
        await whatsappService.sendMessage(
          message.from,
          "Por favor, elige una opción del menú o escribe 'Hola' para regresar al menú principal.",
        );
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
      'buenos dias',
      'buenas tardes',
      'buenas noches',
      'buenas',
    ];
    return greetings.some((greet) => message.includes(greet));
  }

  getSenderName(senderInfo) {
    return (
      senderInfo.profile?.name?.split(' ')[0] || senderInfo.wa_id || 'Usuario'
    );
  }

  async sendWelcomeMessage(to, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `¡Hola ${name}! Te damos la bienvenida a MEDPET nuestro servicio de Veterinaria Online. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage);
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
          'Por favor, ingresa tu nombre para comenzar a agendar una cita.';
        break;
      case 'option_2':
        this.assistantState[to] = { step: 'question' };
        response = '¿Cuál es tu consulta?';
        break;
      case 'option_3':
        response =
          'Te esperamos en nuestra sucursal. Aquí te enviamos la ubicación.';
        await this.sendLocation(to);
        break;
      case 'option_4':
        response =
          '¡Gracias por tu consulta! Si necesitas más ayuda, no dudes en preguntar.';
        break;
      case 'option_5':
        this.assistantState[to] = { step: 'question' };
        response = 'Por favor, ingresa una nueva consulta para continuar.';
        break;
      case 'option_6':
        response =
          'Este es nuestro número de contacto. Si tu mascota está en una situación de emergencia, por favor dirígete a nuestro centro asistencial más cercano o contacta a nuestro servicio de emergencia. Estamos aquí para ayudarte.';
        await this.sendContact(to);
        break;
      default:
        response =
          'Opción no válida. Por favor, elige una opción del menú o escribe "Hola" para regresar al menú principal.';
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
          title: 'Hacer otra consulta',
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

  async sendContact(to) {
    const contact = {
      addresses: [
        {
          street: '123 Calle de las Mascotas',
          city: 'Ciudad',
          state: 'Estado',
          zip: '12345',
          country: 'País',
          country_code: 'PA',
          type: 'WORK',
        },
      ],
      emails: [
        {
          email: 'contacto@medpet.com',
          type: 'WORK',
        },
      ],
      name: {
        formatted_name: 'MedPet Contacto',
        first_name: 'MedPet',
        last_name: 'Contacto',
        middle_name: '',
        suffix: '',
        prefix: '',
      },
      org: {
        company: 'MedPet',
        department: 'Atención al Cliente',
        title: 'Representante',
      },
      phones: [
        {
          phone: '+1234567890',
          wa_id: '1234567890',
          type: 'WORK',
        },
      ],
      urls: [
        {
          url: 'https://www.medpet.com',
          type: 'WORK',
        },
      ],
    };
    await whatsappService.sendContactMessage(to, contact);
  }

  async sendLocation(to) {
    const location = {
      latitude: 8.602742,
      longitude: -71.140201,
      name: 'MedPet Veterinaria',
      address: 'Calle 15, Mérida, Mérida, Venezuela',
    };

    await whatsappService.sendLocationMessage(to, location);
  }
}

export default new MessageHandler();
