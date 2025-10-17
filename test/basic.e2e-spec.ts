import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { testDatabaseConfig } from './database.config';

describe('Basic E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(testDatabaseConfig),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Enable global validation pipe for E2E tests
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Basic API Tests', () => {
    it('should create a user', async () => {
      const createUserDto = {
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toBe('Test User');
    });

    it('should create an event', async () => {
      // First create a user
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Event User' })
        .expect(201);

      const userId = userResponse.body.id;

      const createEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        status: 'TODO',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
        invitees: [userId],
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body.title).toBe('Test Event');
      expect(response.body.status).toBe('TODO');
    });
  });
});
