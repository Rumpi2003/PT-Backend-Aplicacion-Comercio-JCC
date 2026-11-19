import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import type { Usuario as UsuarioType } from './usuario.entity.js';
import { Transaccion } from './transaccion.entity.js';
import type { Transaccion as TransaccionType } from './transaccion.entity.js';

export enum estadoReporte {
    PENDIENTE = 'PENDIENTE',
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

// Un reporte por reportante y transacción; los reportes de perfil (id_transaccion NULL) quedan fuera del índice
@Entity({ name: 'reporte' })
@Index('UQ_reporte_reportante_transaccion', ['usuario_reportante', 'transaccion'], {
    unique: true,
    where: '"id_transaccion" IS NOT NULL'
})
export class Reporte {
    @PrimaryGeneratedColumn({ name: 'id_reporte', type: 'int' })
    id_reporte!: number;

    @ManyToOne(() => Usuario, (usuario_reportante) => usuario_reportante.reportes_realizados, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario_reportante' })
    usuario_reportante!: UsuarioType;

    @ManyToOne(() => Usuario, (usuario_reportado) => usuario_reportado.reportes_recibidos, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_usuario_reportado' })
    usuario_reportado!: UsuarioType;

    // Un mismo chat puede originar varios reportes (p. ej. de ambos participantes), por eso es ManyToOne
    @ManyToOne(() => Transaccion, (transaccion) => transaccion.reportes, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_transaccion' })
    transaccion!: TransaccionType | null;

    @Column({ type: 'enum', enum: Motivo})
    motivo!: Motivo;

    @Column({ type: 'varchar', length: 255 })
    descripcion_reporte!: string;

    // Justificación del administrador al cambiar el estado; obligatoria al sancionar y visible para el usuario sancionado
    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    resolucion!: string | null;

    @Column({ type: 'enum', enum: estadoReporte })
    estado!: estadoReporte;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_creacion!: Date;

    @Column({ type: 'timestamp', default: null, nullable: true })
    fecha_recepcion!: Date | null;
}