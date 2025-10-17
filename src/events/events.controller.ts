import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './entities/event.entity';


@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    //POST /events
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
        return await this.eventsService.createEvent(createEventDto);
    }

    //GET /events/:id
    @Get(':id')
    async getEvent(@Param('id', ParseIntPipe) id: number): Promise<Event> {
        return await this.eventsService.findOne(id);
    }


    //DELETE /events/:id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteEvent(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return await this.eventsService.delete(id);
    }

    //POST /events/merge/:userId
    @Post('merge/:userId')
    async mergeEvents(@Param('userId', ParseIntPipe) userId: number): Promise<Event[]> {
        return await this.eventsService.mergeAllEvents(userId);
    }

}
