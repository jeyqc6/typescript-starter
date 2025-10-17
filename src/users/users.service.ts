import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const user = this.userRepository.create(createUserDto);
        return await this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }
    
    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['events'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async getUserEvents(id: number) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['events', 'events.invitees'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user.events;
    }
}
