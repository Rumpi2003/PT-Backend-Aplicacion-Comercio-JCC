import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';
import { Transaccion } from './transaccion.entity.js';
import { Transaccion as TransaccionType } from './transaccion.entity.js';

@Entity({ name: 'mensaje' })
export class Mensaje {
    @PrimaryGeneratedColumn({ name: 'id_mensaje', type: 'int' })
    id_mensaje!: number;

    @ManyToOne(() => Transaccion, (transaccion) => transaccion.mensajes, { eager: true, nullable: false })
    @JoinColumn({ name: 'id_transaccion' })
    transaccion!: TransaccionType;

    @ManyToOne(() => Usuario, (emisor) => emisor.mensajes_enviados, { eager: true, nullable: false })
    @JoinColumn({ name: 'id_emisor' })
    emisor!: UsuarioType;

    @Column({ type: 'varchar', length: 255 })
    contenido!: string;

    @Column({ type: 'boolean', default: false })
    leido!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_envio!: Date;
}