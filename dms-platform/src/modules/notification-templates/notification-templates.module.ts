import { Module } from '@nestjs/common';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationTemplatesController } from './notification-templates.controller';

@Module({
  providers: [NotificationTemplatesService],
  controllers: [NotificationTemplatesController],
  exports: [NotificationTemplatesService],
})
export class NotificationTemplatesModule {}
