// src\lib\email.ts
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

interface EmailTemplateData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  prompt: string;
  createdAt: string;
  musicFileUrl?: string;
}

interface CreditPurchaseData {
  customerName: string;
  customerEmail: string;
  creditsAdded: number;
  packageName: string;
  totalCredits: number;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    };

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  async sendOrderConfirmation(data: EmailTemplateData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"TuruTuru App" <${process.env.SMTP_USER}>`,
        to: data.customerEmail,
        subject: 'Pedido de Música Confirmado - TuruTuru App',
        html: this.getOrderConfirmationTemplate(data),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Order confirmation email sent to ${data.customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  }

  async sendOrderStatusUpdate(data: EmailTemplateData, newStatus: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"TuruTuru App" <${process.env.SMTP_USER}>`,
        to: data.customerEmail,
        subject: `Atualização do Pedido - ${this.getStatusText(newStatus)}`,
        html: this.getStatusUpdateTemplate(data, newStatus),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Status update email sent to ${data.customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending status update email:', error);
      return false;
    }
  }

  async sendMusicDelivery(data: EmailTemplateData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"TuruTuru App" <${process.env.SMTP_USER}>`,
        to: data.customerEmail,
        subject: 'Sua Música Está Pronta! 🎵 - TuruTuru App',
        html: this.getMusicDeliveryTemplate(data),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Music delivery email sent to ${data.customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending music delivery email:', error);
      return false;
    }
  }

  async sendAdminNotification(data: EmailTemplateData, type: 'new_order' | 'payment_confirmed'): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        console.warn('Admin email not configured');
        return false;
      }

      const subject = type === 'new_order' 
        ? 'Novo Pedido de Música Recebido'
        : 'Pagamento Confirmado - Pedido Pronto para Produção';

      const mailOptions = {
        from: `"TuruTuru App System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject,
        html: this.getAdminNotificationTemplate(data, type),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Admin notification email sent`);
      return true;
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      return false;
    }
  }

  async sendCreditPurchaseConfirmation(data: CreditPurchaseData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"TuruTuru App" <${process.env.SMTP_USER}>`,
        to: data.customerEmail,
        subject: 'Compra de Créditos Confirmada - TuruTuru App',
        html: this.getCreditPurchaseTemplate(data),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Credit purchase confirmation email sent to ${data.customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending credit purchase confirmation email:', error);
      return false;
    }
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pedido Pendente',
      'IN_PRODUCTION': 'Em Produção',
      'COMPLETED': 'Música Pronta',
      'CANCELED': 'Pedido Cancelado',
    };
    return statusMap[status] || status;
  }

  private getOrderConfirmationTemplate(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pedido Confirmado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎵 Pedido Confirmado!</h1>
          <p>Sua música personalizada está sendo preparada</p>
        </div>
        
        <div class="content">
          <p>Olá, <strong>${data.customerName || 'Cliente'}</strong>!</p>
          
          <p>Recebemos seu pedido de música personalizada e ele foi confirmado com sucesso. Nossa equipe começará a trabalhar na sua música em breve.</p>
          
          <div class="order-info">
            <h3>Detalhes do Pedido</h3>
            <p><strong>Número do Pedido:</strong> ${data.orderId}</p>
            <p><strong>Data do Pedido:</strong> ${new Date(data.createdAt).toLocaleDateString('pt-BR')}</p>
            <p><strong>Descrição da Música:</strong></p>
            <blockquote style="background: #f0f0f0; padding: 15px; border-left: 3px solid #667eea; margin: 10px 0;">
              ${data.prompt}
            </blockquote>
          </div>
          
          <p>Você receberá atualizações por email conforme sua música avança no processo de produção. O tempo estimado de entrega é de 24-48 horas.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Ver Meus Pedidos</a>
          </p>
          
          <p>Se você tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
          
          <p>Obrigado por escolher a TuruTuru App!</p>
        </div>
        
        <div class="footer">
          <p>TuruTuru App - Músicas Personalizadas para Crianças</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getStatusUpdateTemplate(data: EmailTemplateData, status: string): string {
    const statusText = this.getStatusText(status);
    const statusEmoji = status === 'IN_PRODUCTION' ? '🎵' : status === 'COMPLETED' ? '✅' : '📋';
    
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Atualização do Pedido</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${statusEmoji} Atualização do Pedido</h1>
          <p>Pedido #${data.orderId}</p>
        </div>
        
        <div class="content">
          <p>Olá, <strong>${data.customerName || 'Cliente'}</strong>!</p>
          
          <div class="status-update">
            <h2>Status Atualizado</h2>
            <h3 style="color: #667eea; font-size: 24px;">${statusText}</h3>
            ${status === 'IN_PRODUCTION' ? '<p>Nossa equipe está trabalhando na sua música personalizada!</p>' : ''}
            ${status === 'COMPLETED' ? '<p>Sua música está pronta! Verifique seu painel para fazer o download.</p>' : ''}
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Ver Detalhes do Pedido</a>
          </p>
        </div>
        
        <div class="footer">
          <p>TuruTuru App - Músicas Personalizadas para Crianças</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getMusicDeliveryTemplate(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sua Música Está Pronta!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .music-delivery { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #4caf50; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 10px; font-size: 16px; }
          .button.secondary { background: #667eea; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎵 Sua Música Está Pronta!</h1>
          <p>A música personalizada que você encomendou foi finalizada</p>
        </div>
        
        <div class="content">
          <p>Olá, <strong>${data.customerName || 'Cliente'}</strong>!</p>
          
          <p>Temos uma ótima notícia! Sua música personalizada está pronta e disponível para download.</p>
          
          <div class="music-delivery">
            <h2>🎵 Música Finalizada</h2>
            <p><strong>Pedido:</strong> ${data.orderId}</p>
            <p><strong>Descrição:</strong> ${data.prompt.substring(0, 100)}${data.prompt.length > 100 ? '...' : ''}</p>
            
            <p style="margin: 25px 0;">
              <a href="${data.musicFileUrl}" class="button">🎵 Ouvir Música</a>
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button secondary">Ver Dashboard</a>
            </p>
          </div>
          
          <p>Esperamos que você e sua família aproveitem muito esta música especial! Se tiver algum feedback ou quiser encomendar outra música, ficaremos felizes em ajudar.</p>
          
          <p><strong>Dica:</strong> Você pode baixar a música e compartilhar com sua família e amigos.</p>
          
          <p>Obrigado por escolher a TuruTuru App!</p>
        </div>
        
        <div class="footer">
          <p>TuruTuru App - Músicas Personalizadas para Crianças</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getAdminNotificationTemplate(data: EmailTemplateData, type: 'new_order' | 'payment_confirmed'): string {
    const isNewOrder = type === 'new_order';
    
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isNewOrder ? 'Novo Pedido' : 'Pagamento Confirmado'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #333; color: white; text-align: center; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #333; }
          .button { display: inline-block; background: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${isNewOrder ? '📝 Novo Pedido Recebido' : '💰 Pagamento Confirmado'}</h1>
        </div>
        
        <div class="content">
          <p><strong>Administrador,</strong></p>
          
          <p>${isNewOrder ? 'Um novo pedido de música foi recebido no sistema.' : 'O pagamento foi confirmado e o pedido está pronto para produção.'}</p>
          
          <div class="order-details">
            <h3>Detalhes do Pedido</h3>
            <p><strong>ID:</strong> ${data.orderId}</p>
            <p><strong>Cliente:</strong> ${data.customerName || 'Nome não informado'} (${data.customerEmail})</p>
            <p><strong>Data:</strong> ${new Date(data.createdAt).toLocaleString('pt-BR')}</p>
            <p><strong>Descrição:</strong></p>
            <blockquote style="background: #f0f0f0; padding: 15px; border-left: 3px solid #333; margin: 10px 0;">
              ${data.prompt}
            </blockquote>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/admin" class="button">Gerenciar Pedidos</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getCreditPurchaseTemplate(data: CreditPurchaseData): string {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Compra de Créditos Confirmada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credit-info { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #4caf50; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 10px; font-size: 16px; }
          .credits-display { font-size: 32px; color: #4caf50; font-weight: bold; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Compra Confirmada!</h1>
          <p>Seus créditos foram adicionados com sucesso</p>
        </div>
        
        <div class="content">
          <p>Olá, <strong>${data.customerName}!</strong></p>
          
          <p>Sua compra de créditos foi processada com sucesso! Agora você pode criar suas músicas personalizadas.</p>
          
          <div class="credit-info">
            <h2>🎫 ${data.packageName}</h2>
            <p><strong>Créditos Adicionados:</strong></p>
            <div class="credits-display">+${data.creditsAdded} créditos</div>
            <p><strong>Total de Créditos:</strong> ${data.totalCredits}</p>
            
            <p style="margin: 25px 0;">
              <a href="${process.env.NEXTAUTH_URL}/criar-musica" class="button">🎵 Criar Minha Música</a>
            </p>
          </div>
          
          <p>Cada crédito permite a criação de uma música única e personalizada. Comece agora mesmo a criar memórias especiais!</p>
          
          <p>Obrigado por escolher a TuruTuru App!</p>
        </div>
        
        <div class="footer">
          <p>TuruTuru App - Músicas Personalizadas para Crianças</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();