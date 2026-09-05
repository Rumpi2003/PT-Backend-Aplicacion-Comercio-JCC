import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TipoCarta } from './tipoCarta.entity.js';
import { TipoCarta as TipoCartaType } from './tipoCarta.entity.js';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';

export enum EstadoMin {
    PERFECTA = 'PERFECTA',
    RECIEN_ABIERTA = 'RECIEN_ABIERTA',
    DESGASTE_MENOR = 'DESGASTE_MENOR',
    DESGASTE_VISIBLE = 'DESGASTE_VISIBLE',
    DESGASTE_SEVERO = 'DESGASTE_SEVERO',
    DAÑADA = 'DAÑADA',
    DESTRUIDA = 'DESTRUIDA'
}
@Entity({ name: 'carta_deseada' })
export class CartaDeseada {
    @PrimaryGeneratedColumn({ name: 'id_carta_deseada', type: 'int' })
    id_carta_deseada!: number;

    @ManyToOne(() => Usuario, (usuario) => usuario.cartas_deseadas, { eager: true })
    @JoinColumn({ name: 'id_usuario' })
    usuario!: UsuarioType;

    @ManyToOne(() => TipoCarta, (tipoCarta) => tipoCarta.deseadas, { eager: true })
    @JoinColumn({ name: 'id_tipo_carta' })
    tipo_carta!: TipoCartaType;

    @Column({ type: 'varchar', length: 255 })
    idioma!: string;

    @Column({ type: 'enum', enum: EstadoMin })
    estado_minimo!: EstadoMin;

    @Column({ type: 'int', default: 1 })
    cantidad!: number;
}
