import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MailerProducer } from './producers/mailer.producer';
import { MailerConsumer } from './consumers/mailer.consumer';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: '"No Reply" <anhhuaan@gmail.com>',
      },
    }),
    BullModule.registerQueue({
      name: 'mailer-queue',
    }),
  ],
  providers: [MailerProducer, MailerConsumer],
  exports: [MailerProducer],
})
export class QueueModule {}