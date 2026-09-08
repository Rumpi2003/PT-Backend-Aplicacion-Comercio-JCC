import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';

@Entity({ name: 'reseña' })
export class Reseña {
    @PrimaryColumn({ name: 'id_usuario_reseñador', type: 'int' })
    id_usuario_reseñador!: number;

    @PrimaryColumn({ name: 'id_usuario_reseñado', type: 'int' })
    id_usuario_reseñado!: number;

    @ManyToOne(() => Usuario, (usuario_reseñador) => usuario_reseñador.reseñas_realizadas, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario_reseñador' })
    usuario_reseñador!: UsuarioType;

    @ManyToOne(() => Usuario, (usuario_reseñado) => usuario_reseñado.reseñas_recibidas, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario_reseñado' })
    usuario_reseñado!: UsuarioType;

    @Column({ type: 'varchar', length: 255 })
    cuerpo!: string;

    @Column({ type: 'int', default: 0 })
    puntuacion!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_creacion!: Date;
}