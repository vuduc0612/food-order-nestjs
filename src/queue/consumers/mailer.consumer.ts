import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
@Processor('mailer-queue')
export class MailerConsumer {
  private readonly logger = new Logger(MailerConsumer.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-mail')
  async handleSendMail(job: Job<{ to: string; subject: string; text: string }>) {
    const { to, subject, text } = job.data;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        text,
      });

      this.logger.log(`✅ Email sent to: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}`, error.stack);
    }
  }
}
