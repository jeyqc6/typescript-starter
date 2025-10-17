import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Event,EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let userRepository: Repository<User>;
  let eventRepository: Repository<Event>;
  let usersService: UsersService;

  const mockUser: User = {
    id: 1,
    name: 'Alice',
    events: [],
  };

  const mockEvent: Event = {
    id: 1,
    title: 'Event 1',
    description: 'Event 1 description',
    status: EventStatus.TODO,
    startTime: new Date(),
    endTime: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    invitees: [mockUser],
  };

  const mockCreateEventDto: CreateEventDto = {
    title: 'Event 1',
    description: 'Event 1 description',
    status: EventStatus.TODO,
    startTime: new Date(),
    endTime: new Date(),
    invitees: [1],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepository = module.get<Repository<Event>>(getRepositoryToken(Event));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    usersService = module.get<UsersService>(UsersService);
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue([mockUser]);
      jest.spyOn(eventRepository, 'create').mockReturnValue(mockEvent);
      jest.spyOn(eventRepository, 'save').mockResolvedValue(mockEvent);

      const result = await service.createEvent(mockCreateEventDto);

      expect(userRepository.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object) }, 
      });
      expect(eventRepository.create).toHaveBeenCalledWith({
        title: mockCreateEventDto.title,
        description: mockCreateEventDto.description,
        status: mockCreateEventDto.status,
        startTime: mockCreateEventDto.startTime,
        endTime: mockCreateEventDto.endTime,
        invitees: [mockUser],
      });
      expect(eventRepository.save).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual(mockEvent);
  })

  it('should create an event without invitees', async () => {
    // Arrange
    const dtoWithoutInvitees = { ...mockCreateEventDto, invitees: undefined };
    const eventWithoutInvitees = { ...mockEvent, invitees: [] };
    
    jest.spyOn(eventRepository, 'create').mockReturnValue(eventWithoutInvitees);
    jest.spyOn(eventRepository, 'save').mockResolvedValue(eventWithoutInvitees);

    // Act
    const result = await service.createEvent(dtoWithoutInvitees);

    // Assert
    expect(eventRepository.create).toHaveBeenCalledWith({
      title: dtoWithoutInvitees.title,
      description: dtoWithoutInvitees.description,
      status: dtoWithoutInvitees.status,
      startTime: dtoWithoutInvitees.startTime,
      endTime: dtoWithoutInvitees.endTime,
      invitees: [],
    });
    expect(result).toEqual(eventWithoutInvitees);
  });

  describe('findOne', () => {
    it('should return an event when found', async () => {
      jest.spyOn(eventRepository, 'findOne').mockResolvedValue(mockEvent);

      const result = await service.findOne(1);

      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['invitees'],
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException when event not found', async () => {
      jest.spyOn(eventRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Event not found');
    });
  });

  describe('delete', () => {
    it('should delete an event successfully', async () => {
      // Arrange
      jest.spyOn(eventRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      // Act
      await service.delete(1);

      // Assert
      expect(eventRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when event not found', async () => {
      // Arrange
      jest.spyOn(eventRepository, 'delete').mockResolvedValue({ affected: 0 } as any);

      // Act & Assert
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      await expect(service.delete(999)).rejects.toThrow('Event not found');
    });
  });

  describe('mergeAllEvents', () => {
    it('should return empty array when user has no events', async () => {
      // Arrange
      jest.spyOn(usersService, 'getUserEvents').mockResolvedValue([]);

      // Act
      const result = await service.mergeAllEvents(1);

      // Assert
      expect(result).toEqual([]);
    });
  });

  it('should merge overlapping events correctly', async () => {
    // Arrange
    const overlappingEvents: Event[] = [
      {
        ...mockEvent,
        id: 1,
        title: 'Event A',
        startTime: new Date('2024-01-20T14:00:00Z'),
        endTime: new Date('2024-01-20T15:00:00Z'),
      },
      {
        ...mockEvent,
        id: 2,
        title: 'Event B',
        startTime: new Date('2024-01-20T14:30:00Z'),
        endTime: new Date('2024-01-20T16:00:00Z'),
      },
    ];

    const mergedEvent: Event = {
      ...mockEvent,
      id: 3,
      title: 'Event A | Event B',
      startTime: new Date('2024-01-20T14:00:00Z'),
      endTime: new Date('2024-01-20T16:00:00Z'),
    };

    jest.spyOn(usersService, 'getUserEvents').mockResolvedValue(overlappingEvents);
    jest.spyOn(userRepository, 'find').mockResolvedValue([mockUser]);
    jest.spyOn(eventRepository, 'create').mockReturnValue(mergedEvent);
    jest.spyOn(eventRepository, 'save').mockResolvedValue(mergedEvent);
    jest.spyOn(eventRepository, 'delete').mockResolvedValue({ affected: 2 } as any);

    // Act
    const result = await service.mergeAllEvents(1);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Event A | Event B');
    expect(result[0].startTime).toEqual(new Date('2024-01-20T14:00:00Z'));
    expect(result[0].endTime).toEqual(new Date('2024-01-20T16:00:00Z'));
  });

  it('should not merge non-overlapping events', async () => {
    // Arrange
    const nonOverlappingEvents: Event[] = [
      {
        ...mockEvent,
        id: 1,
        title: 'Event A',
        startTime: new Date('2024-01-20T14:00:00Z'),
        endTime: new Date('2024-01-20T15:00:00Z'),
      },
      {
        ...mockEvent,
        id: 2,
        title: 'Event B',
        startTime: new Date('2024-01-20T16:00:00Z'),
        endTime: new Date('2024-01-20T17:00:00Z'),
      },
    ];

    jest.spyOn(usersService, 'getUserEvents').mockResolvedValue(nonOverlappingEvents);

    // Act
    const result = await service.mergeAllEvents(1);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Event A');
    expect(result[1].title).toBe('Event B');
  });
  });

});
