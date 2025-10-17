import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUser: User = {
    id: 1,
    name: 'Alice',
    events: [],
  };

  const mockCreateUserDto: CreateUserDto = {
    name: 'Alice',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      // Arrange
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      // Act
      const result = await service.create(mockCreateUserDto);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['events'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserEvents', () => {
    it('should return user events', async () => {
      // Arrange
      const userWithEvents = {
        ...mockUser,
        events: [
          {
            id: 1,
            title: 'Test Event',
            description: 'Test Description',
            status: 'TODO' as any,
            startTime: new Date('2024-01-20T14:00:00Z'),
            endTime: new Date('2024-01-20T15:00:00Z'),
            createdAt: new Date(),
            updatedAt: new Date(),
            invitees: [mockUser],
          },
        ],
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithEvents);

      // Act
      const result = await service.getUserEvents(1);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['events', 'events.invitees'],
      });
      expect(result).toEqual(userWithEvents.events);
    });
  });
});