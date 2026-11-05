import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';
import { Transaccion } from './transaccion.entity.js';
import { Transaccion as TransaccionType } from './transaccion.entity.js';

@Entity({ name: 'mensaje' })
// Acelera el conteo de no leídos y el marcado como leído, que solo miran los mensajes pendientes
@Index('IDX_mensaje_no_leidos', ['transaccion', 'emisor'], { where: '"leido" = false' })
export class Mensaje {
    @PrimaryGeneratedColumn({ name: 'id_mensaje', type: 'int' })
    id_mensaje!: number;

    @ManyToOne(() => Transaccion, (transaccion) => transaccion.mensajes, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_transaccion' })
    transaccion!: TransaccionType;

    @ManyToOne(() => Usuario, (emisor) => emisor.mensajes_enviados, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_emisor' })
    emisor!: UsuarioType;

    @Column({ type: 'varchar', length: 255 })
    contenido!: string;

    @Column({ type: 'boolean', default: false })
    leido!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_envio!: Date;
}