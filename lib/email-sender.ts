import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.titan.email",
  port: 587,
  secure: false, // usar STARTTLS
  auth: {
    user: "suporte@viraweb.online",
    pass: process.env.TITAN_EMAIL_PASSWORD, // A senha deve ser configurada via variável de ambiente
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: "suporte@viraweb.online",
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html,
    });

    console.log("✅ E-mail enviado com sucesso:", info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    throw error;
  }
}