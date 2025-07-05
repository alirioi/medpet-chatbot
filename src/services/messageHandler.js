import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
      } else {
        const response = `Este es el *Echo* de tu mensaje:\n\n*${message.text.body}*`;
        await whatsappService.sendMessage(message.from, response, message.id);
      }

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
}

export default new MessageHandler();
