import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type MessageDirection = 'in' | 'out';

// Tabla donde guardo todos los mensajes que entran y salen por WhatsApp
@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true, sparse: true })
  @Column({ type: 'varchar', nullable: true, unique: false })
  whatsappId: string | null;

  @Column()
  fromNumber: string;

  @Column()
  toNumber: string;

  @Column({ type: 'varchar', length: 3 })
  direction: MessageDirection;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  toolUsed?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload?: object;

  @CreateDateColumn()
  createdAt: Date;
}