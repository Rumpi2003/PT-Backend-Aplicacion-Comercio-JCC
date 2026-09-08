import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CartaOfrecida } from './cartaOfrecida.entity.js';
import { CartaOfrecida as CartaOfrecidaType } from './cartaOfrecida.entity.js';
import { Transaccion } from './transaccion.entity.js';
import { Transaccion as TransaccionType } from './transaccion.entity.js';

@Entity({ name: 'detalle_transaccion' })
export class DetalleTransaccion {
    @PrimaryColumn({ name: 'id_transaccion', type: 'int' })
    id_transaccion!: number;

    @PrimaryColumn({ name: 'id_carta_ofrecida', type: 'int' })
    id_carta_ofrecida!: number;

    @ManyToOne(() => CartaOfrecida, (cartaOfrecida) => cartaOfrecida.detalles_transaccion, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_carta_ofrecida' })
    carta_ofrecida!: CartaOfrecidaType;

    @ManyToOne(() => Transaccion, (transaccion) => transaccion.detalles_transaccion, { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_transaccion' })
    transaccion!: TransaccionType;

    @Column({ type: 'int' })
    precio_acordado!: number;

    @Column({ type: 'int' })
    cantidad!: number;
}