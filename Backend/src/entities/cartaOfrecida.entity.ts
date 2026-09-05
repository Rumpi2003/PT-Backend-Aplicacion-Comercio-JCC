import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';
import { TipoCarta } from './tipoCarta.entity.js';
import { TipoCarta as TipoCartaType } from './tipoCarta.entity.js';
import { DetalleTransaccion } from './detalleTransaccion.entity.js';
import { DetalleTransaccion as DetalleTransaccionType } from './detalleTransaccion.entity.js';

export enum Estado {
    PERFECTA = 'PERFECTA',
    RECIEN_ABIERTA = 'RECIEN_ABIERTA',
    DESGASTE_MENOR = 'DESGASTE_MENOR',
    DESGASTE_VISIBLE = 'DESGASTE_VISIBLE',
    DESGASTE_SEVERO = 'DESGASTE_SEVERO',
    DAÑADA = 'DAÑADA',
    DESTRUIDA = 'DESTRUIDA'
}
@Entity({ name: 'carta_ofrecida' })
export class CartaOfrecida {
    @PrimaryGeneratedColumn({ name: 'id_carta_ofrecida', type: 'int' })
    id_carta_ofrecida!: number;

    @ManyToOne(() => Usuario, (usuario) => usuario.cartas_ofrecidas, { eager: true })
    @JoinColumn({ name: 'id_usuario' })
    usuario!: UsuarioType;

    @ManyToOne(() => TipoCarta, (tipoCarta) => tipoCarta.ofrecidas, { eager: true })
    @JoinColumn({ name: 'id_tipo_carta' })
    tipo_carta!: TipoCartaType;

    @Column({ type: 'enum', enum: Estado })
    estado!: Estado;

    @Column({ type: 'varchar', length: 255 })
    idioma!: string;

    @Column({ type: 'int' })
    precio!: number;

    @Column({ type: 'int', default: 1 })
    cantidad!: number;

    @OneToMany(() => DetalleTransaccion, (detalleTransaccion) => detalleTransaccion.carta_ofrecida, { nullable: true })
    detalles_transaccion!: DetalleTransaccionType[];
}
