import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
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
          title: 'Consulta información',
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
        response =
          'Has seleccionado *Agendar cita*. Por favor, proporciona los detalles de tu mascota y la fecha deseada.';
        break;
      case 'option_2':
        response =
          'Has seleccionado *Consulta información*. ¿Qué información necesitas?';
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
}

export default new MessageHandler();
