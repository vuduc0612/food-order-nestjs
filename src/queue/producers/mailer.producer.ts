import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class MailerProducer {
  constructor(
    @InjectQueue('mailer-queue') private readonly mailerQueue: Queue,
  ) {}

  async sendMail(mail: any) {
    await this.mailerQueue.add('send-mail', mail);
  }
}
