import { Controller, Post, Body, Get, Param, ParseIntPipe} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Event } from '../events/entities/event.entity';


@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
        return await this.usersService.create(createUserDto);
    }

    @Get()
    async findAll(): Promise<User[]> {
        return await this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
        return await this.usersService.findOne(id);
    }

    @Get(':id/events')
    async getUserEvents(@Param('id', ParseIntPipe) id: number): Promise<Event[]> {
        return await this.usersService.getUserEvents(id);
    }
    

}
