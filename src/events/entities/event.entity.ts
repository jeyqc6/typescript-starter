import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum EventStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: EventStatus.TODO
    })
    status: EventStatus;

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;

    @Column({type: 'datetime'})
    startTime: Date;
    
    @Column({type: 'datetime'})
    endTime: Date;
    
    @ManyToMany(() => User, (user) => user.events)
    @JoinTable({
        name: 'event_invitees',
        joinColumn: {
            name: 'event_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'id'
        }
    })
    invitees: User[];


}