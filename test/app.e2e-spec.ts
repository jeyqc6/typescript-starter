import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { testDatabaseConfig } from './database.config';

describe('Event Management System E2E Tests', () => {
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
    await app.close();
  });

  describe('Users API', () => {
    let createdUserId: number;

    it('POST /users - should create a new user', async () => {
      const createUserDto = {
        name: 'Alice Johnson',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toBe('Alice Johnson');
      expect(typeof response.body.id).toBe('number');

      createdUserId = response.body.id;
    });

    it('GET /users/:id - should retrieve user by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(200);

      expect(response.body.id).toBe(createdUserId);
      expect(response.body.name).toBe('Alice Johnson');
      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('GET /users - should retrieve all users', async () => {
      // Create another user first
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Bob Smith' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /users/:id - should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/99999')
        .expect(404);
    });

    it('GET /users/:id/events - should retrieve user events', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}/events`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Events API', () => {
    let eventId: number;
    let userId: number;

    beforeAll(async () => {
      // Create a test user for event tests
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Event Test User' })
        .expect(201);
      userId = userResponse.body.id;
    });

    it('POST /events - should create a new event', async () => {
      const createEventDto = {
        title: 'Team Meeting',
        description: 'Weekly team sync meeting',
        status: 'TODO',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
        invitees: [userId],
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
      expect(response.body).toHaveProperty('invitees');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Verify values
      expect(response.body.title).toBe('Team Meeting');
      expect(response.body.description).toBe('Weekly team sync meeting');
      expect(response.body.status).toBe('TODO');
      expect(response.body.invitees).toHaveLength(1);
      expect(response.body.invitees[0].id).toBe(userId);

      eventId = response.body.id;
    });

    it('POST /events - should create event without invitees', async () => {
      const createEventDto = {
        title: 'Personal Task',
        description: 'Individual work session',
        status: 'IN_PROGRESS',
        startTime: '2024-01-21T09:00:00Z',
        endTime: '2024-01-21T10:00:00Z',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(201);

      expect(response.body.title).toBe('Personal Task');
      expect(response.body.invitees).toHaveLength(0);
    });

    it('GET /events/:id - should retrieve event by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200);

      expect(response.body.id).toBe(eventId);
      expect(response.body.title).toBe('Team Meeting');
      expect(response.body.invitees).toHaveLength(1);
      expect(response.body.invitees[0].id).toBe(userId);
    });

    it('GET /events/:id - should return 404 for non-existent event', async () => {
      await request(app.getHttpServer())
        .get('/events/99999')
        .expect(404);
    });

    it('DELETE /events/:id - should delete event', async () => {
      // Create a new event to delete
      const createEventDto = {
        title: 'Event to Delete',
        description: 'This event will be deleted',
        status: 'TODO',
        startTime: '2024-01-22T10:00:00Z',
        endTime: '2024-01-22T11:00:00Z',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(201);

      const eventToDeleteId = createResponse.body.id;

      // Delete the event
      await request(app.getHttpServer())
        .delete(`/events/${eventToDeleteId}`)
        .expect(204);

      // Verify event is deleted
      await request(app.getHttpServer())
        .get(`/events/${eventToDeleteId}`)
        .expect(404);
    });

    it('DELETE /events/:id - should return 404 when deleting non-existent event', async () => {
      await request(app.getHttpServer())
        .delete('/events/99999')
        .expect(404);
    });
  });

  describe('MergeAll API', () => {
    let userId: number;

    beforeAll(async () => {
      // Create a test user for merge tests
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Merge Test User' });
      userId = userResponse.body.id;
    });

    it('POST /events/merge/:userId - should merge overlapping events', async () => {
      // Create overlapping events
      const event1 = {
        title: 'Morning Meeting',
        description: 'Daily standup',
        status: 'TODO',
        startTime: '2024-01-20T09:00:00Z',
        endTime: '2024-01-20T10:00:00Z',
        invitees: [userId],
      };

      const event2 = {
        title: 'Extended Meeting',
        description: 'Follow-up discussion',
        status: 'IN_PROGRESS',
        startTime: '2024-01-20T09:30:00Z',
        endTime: '2024-01-20T11:00:00Z',
        invitees: [userId],
      };

      const event3 = {
        title: 'Another Meeting',
        description: 'Separate meeting',
        status: 'COMPLETED',
        startTime: '2024-01-20T12:00:00Z',
        endTime: '2024-01-20T13:00:00Z',
        invitees: [userId],
      };

      // Create all events
      await request(app.getHttpServer())
        .post('/events')
        .send(event1)
        .expect(201);

      await request(app.getHttpServer())
        .post('/events')
        .send(event2)
        .expect(201);

      await request(app.getHttpServer())
        .post('/events')
        .send(event3)
        .expect(201);

      // Execute merge operation
      const response = await request(app.getHttpServer())
        .post(`/events/merge/${userId}`)
        .expect(201);

      // Verify merge results
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2); // 2 groups: merged overlapping + separate

      // Find the merged event (should contain both titles)
      const mergedEvent = response.body.find(event => 
        event.title.includes('Morning Meeting') && event.title.includes('Extended Meeting')
      );

      expect(mergedEvent).toBeDefined();
      expect(mergedEvent.title).toContain('Morning Meeting');
      expect(mergedEvent.title).toContain('Extended Meeting');
      expect(mergedEvent.status).toBe('IN_PROGRESS'); // Highest priority status
      expect(new Date(mergedEvent.startTime)).toEqual(new Date('2024-01-20T09:00:00Z'));
      expect(new Date(mergedEvent.endTime)).toEqual(new Date('2024-01-20T11:00:00Z'));

      // Verify the separate event remains unchanged
      const separateEvent = response.body.find(event => 
        event.title === 'Another Meeting'
      );
      expect(separateEvent).toBeDefined();
      expect(separateEvent.title).toBe('Another Meeting');
    });

    it('POST /events/merge/:userId - should return empty array when user has no events', async () => {
      // Create a user with no events
      const emptyUserResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Empty User' });
      const emptyUserId = emptyUserResponse.body.id;

      const response = await request(app.getHttpServer())
        .post(`/events/merge/${emptyUserId}`)
        .expect(201);

      expect(response.body).toEqual([]);
    });

    it('POST /events/merge/:userId - should handle single event (no merge needed)', async () => {
      // Create a user with one event
      const singleUserResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Single Event User' });
      const singleUserId = singleUserResponse.body.id;

      // Create one event
      await request(app.getHttpServer())
        .post('/events')
        .send({
          title: 'Single Event',
          description: 'Only one event',
          status: 'TODO',
          startTime: '2024-01-21T10:00:00Z',
          endTime: '2024-01-21T11:00:00Z',
          invitees: [singleUserId],
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/events/merge/${singleUserId}`)
        .expect(201);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Single Event');
    });

    it('POST /events/merge/:userId - should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/events/merge/99999')
        .expect(404);
    });
  });

  describe('Input Validation Tests', () => {
    it('POST /events - should validate required fields', async () => {
      const invalidEvent = {
        description: 'Missing required fields',
        // Missing: title, status, startTime, endTime
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(invalidEvent)
        .expect(400);
    });

    it('POST /events - should validate enum values', async () => {
      const invalidEvent = {
        title: 'Test Event',
        status: 'INVALID_STATUS',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(invalidEvent)
        .expect(400);
    });

    it('POST /events - should validate date format', async () => {
      const invalidEvent = {
        title: 'Test Event',
        status: 'TODO',
        startTime: 'invalid-date',
        endTime: '2024-01-20T15:00:00Z',
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(invalidEvent)
        .expect(400);
    });

    it('POST /users - should validate required fields', async () => {
      const invalidUser = {
        // Missing name field
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(invalidUser)
        .expect(400);
    });

    it('POST /users - should validate name is not empty', async () => {
      const invalidUser = {
        name: '',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(invalidUser)
        .expect(400);
    });

    it('GET /events/:id - should validate numeric id', async () => {
      await request(app.getHttpServer())
        .get('/events/invalid-id')
        .expect(400);
    });

    it('GET /users/:id - should validate numeric id', async () => {
      await request(app.getHttpServer())
        .get('/users/invalid-id')
        .expect(400);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle events with same start and end time', async () => {
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Edge Case User' });
      const userId = userResponse.body.id;

      const event = {
        title: 'Instant Event',
        description: 'Event with same start and end time',
        status: 'TODO',
        startTime: '2024-01-20T12:00:00Z',
        endTime: '2024-01-20T12:00:00Z',
        invitees: [userId],
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(event)
        .expect(201);

      expect(response.body.title).toBe('Instant Event');
    });

    it('should handle events with multiple invitees', async () => {
      // Create multiple users
      const user1Response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'User 1' });
      const user2Response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'User 2' });
      const user3Response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'User 3' });

      const event = {
        title: 'Multi-User Meeting',
        description: 'Meeting with multiple participants',
        status: 'TODO',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
        invitees: [user1Response.body.id, user2Response.body.id, user3Response.body.id],
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .send(event)
        .expect(201);

      expect(response.body.invitees).toHaveLength(3);
      expect(response.body.invitees.map(u => u.id)).toEqual(
        expect.arrayContaining([user1Response.body.id, user2Response.body.id, user3Response.body.id])
      );
    });
  });
});