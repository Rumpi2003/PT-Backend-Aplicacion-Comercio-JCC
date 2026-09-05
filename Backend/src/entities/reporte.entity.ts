import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';
import { Transaccion } from './transaccion.entity.js';
import { Transaccion as TransaccionType } from './transaccion.entity.js';

export enum estadoReporte {
    PENDIENTE = 'PENDIENTE',
    EN_REVISION = 'EN_REVISION',
    DESESTIMADO = 'DESESTIMADO',
    SANCIONADO = 'SANCIONADO',
    ARCHIVADO = 'ARCHIVADO'
}

export enum Motivo {
    CARTAS_FALSAS = 'CARTAS_FALSAS',
    ESTADO_ERRONEO = 'ESTADO_ERRONEO',
    INFORMACION_FALSA = 'INFORMACION_FALSA',
    NO_APARECE = 'NO_APARECE',
    ESTAFA = 'ESTAFA',
    CANCELACION_REPETITIVA = 'CANCELACION_REPETITIVA',
    ACOSO_CHAT = 'ACOSO_CHAT',
    CONDUCTA_PELIGROSA = 'CONDUCTA_PELIGROSA',
    LUGAR_INSEGURO = 'LUGAR_INSEGURO',
    SPAM = 'SPAM',
    SUPLANTACION = 'SUPLANTACION',
    OTRO = 'OTRO',
}

@Entity({ name: 'reporte' })
export class Reporte {
    @PrimaryGeneratedColumn({ name: 'id_reporte', type: 'int' })
    id_reporte!: number;

    @ManyToOne(() => Usuario, (usuario_reportante) => usuario_reportante.reportes_realizados, { eager: true, nullable: false })
    @JoinColumn({ name: 'id_usuario_reportante' })
    usuario_reportante!: UsuarioType;

    @ManyToOne(() => Usuario, (usuario_reportado) => usuario_reportado.reportes_recibidos, { eager: true, nullable: false })
    @JoinColumn({ name: 'id_usuario_reportado' })
    usuario_reportado!: UsuarioType;

    @OneToOne(() => Transaccion, (transaccion) => transaccion.reporte, { eager: true, nullable: true })
    @JoinColumn({ name: 'id_transaccion' })
    transaccion!: TransaccionType | null;

    @Column({ type: 'enum', enum: Motivo})
    motivo!: Motivo;

    @Column({ type: 'varchar', length: 255 })
    descripcion_reporte!: string;

    @Column({ type: 'enum', enum: estadoReporte })
    estado!: estadoReporte;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_creacion!: Date;

    @Column({ type: 'timestamp', default: null, nullable: true })
    fecha_recepcion!: Date | null;
}