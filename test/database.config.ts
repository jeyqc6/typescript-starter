import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Event } from '../src/events/entities/event.entity';
import { User } from '../src/users/entities/user.entity';

// Test database configuration using MySQL
export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306, // Default MySQL port
  username: 'root',
  password: 'root', // Change this to your MySQL password
  database: 'events_test_db', // Separate test database
  entities: [Event, User],
  synchronize: true, // Automatically create table structure
  logging: false, // Don't show SQL logs during testing
  dropSchema: true, // Drop and recreate schema for each test run
};