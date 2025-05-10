import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MailerProducer } from './producers/mailer.producer';
import { MailerConsumer } from './consumers/mailer.consumer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: '"No Reply" <anhhuaan@gmail.com>',
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'mailer-queue',
    }),
  ],
  providers: [MailerProducer, MailerConsumer],
  exports: [MailerProducer],
})
export class QueueModule {}