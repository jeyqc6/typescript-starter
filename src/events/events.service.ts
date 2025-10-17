import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../users/entities/user.entity';
import { Event, EventStatus } from './entities/event.entity';
import {UsersService} from '../users/users.service';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        private usersService: UsersService,
    ) {}

    async createEvent(createEventDto: CreateEventDto): Promise<Event> {
        // Find invitees if provided
        let invitees: User[] = [];
        if (createEventDto.invitees && createEventDto.invitees.length > 0) {
            invitees = await this.userRepository.find({
                where: { id: In(createEventDto.invitees) }
            });
        }

        // Create event
        const event = this.eventRepository.create({
            title: createEventDto.title,
            description: createEventDto.description,
            status: createEventDto.status,
            startTime: createEventDto.startTime,
            endTime: createEventDto.endTime,
            invitees: invitees,
        });

        // Save event
        return await this.eventRepository.save(event);
    }

    //Find one event by id
    async findOne(id: number): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: {id },
            relations: ['invitees'],
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        return event;
    }

    //delete event according to id
    async delete(id: number) : Promise<void> {
        const result = await this.eventRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException('Event not found');
        }
    }

    async mergeAllEvents(userId: number) {
        const events = await this.usersService.getUserEvents(userId);

        if (events.length === 0) {
            return [];
        }

        //sort events by start time
        const sortedEvents = events.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        // Group overlapping events using simplified approach
        const groups: Event[][] = [];
        const groupTimeRanges: [Date, Date][] = [];
        let currentGroup: Event[] = [sortedEvents[0]];
        let currentGroupStartTime: number = new Date(sortedEvents[0].startTime).getTime();
        let currentGroupEndTime: number = new Date(sortedEvents[0].endTime).getTime();
        for (let i = 1; i < sortedEvents.length; i++) {
            const currentEvent = sortedEvents[i];
                
            // Check if current event overlaps with group's time range
            if (this.timeOverlaps(new Date(currentGroupStartTime), new Date(currentGroupEndTime), new Date(currentEvent.startTime), new Date(currentEvent.endTime))) {
                // Add to current group and extend group's time range
                currentGroup.push(currentEvent);
                currentGroupEndTime = Math.max(currentGroupEndTime, new Date(currentEvent.endTime).getTime());
            } else {
                // No overlap, save current group and start new one
                groups.push([...currentGroup]);
                groupTimeRanges.push([new Date(currentGroupStartTime), new Date(currentGroupEndTime)]);
                currentGroup = [currentEvent];
                currentGroupStartTime = new Date(currentEvent.startTime).getTime();
                currentGroupEndTime = new Date(currentEvent.endTime).getTime();
            }
        }
        
        // The last group
        groups.push(currentGroup);
        groupTimeRanges.push([new Date(currentGroupStartTime), new Date(currentGroupEndTime)]);
      

        // Merge each group
        const mergedEvents: Event[] = [];
        for (let i = 0; i < groups.length; i++) {
            const merged = await this.mergeEvents(groups[i], groupTimeRanges[i]);
            mergedEvents.push(merged);
        }

        return mergedEvents;
    }

    /**
     * check if two time ranges overlap
     */
    private timeOverlaps(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
        const end1Time = new Date(end1).getTime();
        const start2Time = new Date(start2).getTime();

        // Time ranges overlap if one starts before the other ends
        return start2Time <= end1Time;
    }

    /**
     * merge a group of events
     */
    private async mergeEvents(events: Event[], timeRange: [Date, Date]): Promise<Event> {
        //if there is only one event, return it
        if (events.length === 1) {
            return events[0];
        }

        //calculate merged time range
        const mergedStartTime = timeRange[0];
        const mergedEndTime = timeRange[1];

        //merge titles
        const mergedTitle = events.map(e => e.title).join(' | ');

        //merge descriptions
        const descriptions = events
            .map(e => e.description)
            .filter(d => d && d.trim() !== '');
        const mergedDescription = descriptions.length > 0 
            ? descriptions.join(' | ') 
            : null;

        //merge status (priority: IN_PROGRESS > TODO > COMPLETED)
        const mergedStatus = this.mergeStatus(events.map(e => e.status));

        //merge invitees (unique users)
        const allInvitees = events.flatMap(e => e.invitees || []);
        const uniqueInviteeIds = [...new Set(allInvitees.map(u => u.id))];
        const mergedInvitees = await this.userRepository.find({
            where: { id: In(uniqueInviteeIds) }
        });

        //create merged event
        const mergedEvent = this.eventRepository.create({
            title: mergedTitle,
            description: mergedDescription,
            status: mergedStatus,
            startTime: mergedStartTime,
            endTime: mergedEndTime,
            invitees: mergedInvitees,
        });

        //save merged event
        const savedEvent = await this.eventRepository.save(mergedEvent);

        //delete old events
        const eventIdsToDelete = events.map(e => e.id);
        await this.eventRepository.delete(eventIdsToDelete);

        return savedEvent;
    }

    /**
     * Choose the most appropriate status when merging
     * IN_PROGRESS > TODO > COMPLETED
     */
    private mergeStatus(statuses: EventStatus[]): EventStatus {
        if (statuses.includes(EventStatus.IN_PROGRESS)) {
            return EventStatus.IN_PROGRESS;
        }
        if (statuses.includes(EventStatus.TODO)) {
            return EventStatus.TODO;
        }
        return EventStatus.COMPLETED;
    }

}
