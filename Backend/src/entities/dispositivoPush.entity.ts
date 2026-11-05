import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';

// Un usuario puede tener varios dispositivos; el token de FCM es único y se reasigna si otra cuenta inicia sesión en el mismo dispositivo
@Entity({ name: 'dispositivo_push' })
export class DispositivoPush {
    @PrimaryGeneratedColumn({ name: 'id_dispositivo', type: 'int' })
    id_dispositivo!: number;

    @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario' })
    usuario!: UsuarioType;

    @Column({ type: 'varchar', length: 512, unique: true })
    token!: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_registro!: Date;
}
