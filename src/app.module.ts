import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { User } from './users/entities/user.entity';
import { Event } from './events/entities/event.entity';

const isTest = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'events_db',
      entities: [Event, User],
      autoLoadEntities: true,
      logging: false,
      // Do not drop schema automatically to avoid accidental data loss
      dropSchema: false,
      synchronize: true, // Note: set to false in production
    }),
    UsersModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
