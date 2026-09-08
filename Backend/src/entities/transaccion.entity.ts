import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';
import { Reporte } from './reporte.entity.js';
import { Reporte as ReporteType } from './reporte.entity.js';
import { Mensaje } from './mensaje.entity.js';
import { Mensaje as MensajeType } from './mensaje.entity.js';
import { DetalleTransaccion } from './detalleTransaccion.entity.js';
import { DetalleTransaccion as DetalleTransaccionType } from './detalleTransaccion.entity.js';

export enum estadoTransaccion {
    EN_NEGOCIACION = 'EN_NEGOCIACION',
    RECHAZADA = 'RECHAZADA',
    PENDIENTE = 'PENDIENTE',
    COMPLETADA = 'COMPLETADA',
    CANCELADA = 'CANCELADA'
}

@Entity({ name: 'transaccion' })
export class Transaccion {
    @PrimaryGeneratedColumn({ name: 'id_transaccion', type: 'int' })
    id_transaccion!: number;

    @ManyToOne(() => Usuario, (usuario_1) => usuario_1.transacciones_1, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario_1' })
    usuario_1!: UsuarioType;

    @ManyToOne(() => Usuario, (usuario_2) => usuario_2.transacciones_2, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario_2' })
    usuario_2!: UsuarioType;

    @Column({ type: 'int', default: 0 })
    diferencia_a_pagar_1!: number;

    @Column({ type: 'int', default: 0 })
    diferencia_a_pagar_2!: number;

    @Column({ type: 'enum', enum: estadoTransaccion, default: estadoTransaccion.EN_NEGOCIACION })
    estado!: estadoTransaccion;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_creacion!: Date;

    @OneToOne(() => Reporte, (reporte) => reporte.transaccion, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_reporte' })
    reporte!: ReporteType | null;

    @OneToMany(() => Mensaje, (mensaje) => mensaje.transaccion, { nullable: true })
    mensajes!: MensajeType[];

    @OneToMany(() => DetalleTransaccion, (detalleTransaccion) => detalleTransaccion.transaccion, { nullable: true })
    detalles_transaccion!: DetalleTransaccionType[];
}