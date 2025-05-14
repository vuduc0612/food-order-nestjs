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
          user: 'anhhuaan@gmail.com',
          pass: 'aizx rezw wspz rsbs',
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