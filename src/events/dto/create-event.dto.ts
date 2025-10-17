import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray, IsNumber } from 'class-validator';
import { EventStatus } from '../entities/event.entity';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;
    
    @IsEnum(EventStatus)
    @IsNotEmpty()
    status: EventStatus;

    @IsDateString()
    @IsNotEmpty()
    startTime: Date;

    @IsDateString()
    @IsNotEmpty()
    endTime: Date;

    @IsArray()
    @IsNumber({}, {each: true})
    @IsOptional()
    invitees?: number[];
}