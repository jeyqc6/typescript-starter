## Project: NestJS Event Management Feature
### Demo video
https://drive.google.com/file/d/1u7m_hRGQFJGR4MNRWq5GoBk0PoAHYoxg/view?usp=sharing
### Overview
Adds an Events feature to the NestJS TypeScript starter:
- Event entity with CRUD and MergeAll.
- User entity with Many-to-Many relation to Events (invitees).
- Unit tests and E2E tests (real MySQL).

Stack: NestJS 11, TypeORM, MySQL, Jest, Supertest, class-validator.

### Requirements
- Node >= 20, npm >= 10
- MySQL on localhost:3306 (adjust if different)

### Database
- Create databases:
  - `events_db` (dev)
  - `events_test_db` (optional for test isolation)
- Development connection is configured in `src/app.module.ts`.
- If you enable a separate test DB, also update `test/database.config.ts`.

Tables are auto-created via `synchronize: true` in development. Do not use synchronize in production; switch to migrations.

### Install
```bash
npm install
```

### Run (development)
```bash
npm run start:dev
# server: http://localhost:3000
```

### API
- `POST /users`
  - body: `{ name: string }`
- `GET /users/:id`
- `GET /users/:id/events`

- `POST /events`
  - body:
    - `title`: string (required)
    - `description?`: string
    - `status`: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' (required)
    - `startTime`: ISO datetime string
    - `endTime`: ISO datetime string
    - `invitees?`: number[] (User IDs)
- `GET /events/:id`
- `DELETE /events/:id`
- `POST /events/merge/:userId`
  - Merge all overlapping events for a given user.
  - Creates a merged event, deletes the originals, merges invitees, status by priority, and concatenates title/description.

### MergeAll Behavior
- Sort by `startTime`, group by overlapping ranges.
- For each group:
  - time: `min(startTime)` → `max(endTime)`
  - title: join with " | "
  - description: join non-empty with " | "
  - status priority: `IN_PROGRESS > TODO > COMPLETED`
  - invitees: unique set across group
- Persist merged event. Delete grouped originals.

### Examples (curl)
Create user:
```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

Create event:
```bash
curl -s -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Team Meeting",
    "description":"Weekly sync",
    "status":"TODO",
    "startTime":"2024-01-20T14:00:00Z",
    "endTime":"2024-01-20T15:00:00Z",
    "invitees":[1]
  }'
```

Get event:
```bash
curl -s http://localhost:3000/events/1
```

Merge all for user:
```bash
curl -s -X POST http://localhost:3000/events/merge/1
```

Delete event:
```bash
curl -s -X DELETE http://localhost:3000/events/1 -o /dev/null -w "%{http_code}\n"
```

### Tests
- Unit tests:
```bash
npm test
```

- E2E tests (ensure `src/app.module.ts` matches your credentials and DB):
```bash
NODE_ENV=test npm run test:e2e
# Or only basic E2E suite:
NODE_ENV=test npm run test:e2e -- --testPathPattern=basic.e2e-spec.ts
```

- Coverage:
```bash
npm run test:cov
```

### Design Notes
- `status` stored as `varchar(20)` for cross-DB compatibility; typed as enum in code.
- Many-to-Many between Users and Events to support invitees and MergeAll persistence.
- Validation via class-validator; global ValidationPipe enabled.

### Production Notes
- Disable `synchronize` and add migrations.
- Move secrets/DB credentials to environment variables or a config service.
