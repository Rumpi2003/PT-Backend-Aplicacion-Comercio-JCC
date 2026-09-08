import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Franquicia } from './franquicia.entity.js';
import { Franquicia as FranquiciaType } from './franquicia.entity.js';
import { CartaDeseada } from './cartaDeseada.entity.js';
import { CartaDeseada as CartaDeseadaType } from './cartaDeseada.entity.js';
import { CartaOfrecida } from './cartaOfrecida.entity.js';
import { CartaOfrecida as CartaOfrecidaType } from './cartaOfrecida.entity.js';

@Entity({ name: 'tipo_carta' })
export class TipoCarta {
    @PrimaryGeneratedColumn({ name: 'id_tipo_carta', type: 'int' })
    id_tipo_carta!: number;

    @ManyToOne(() => Franquicia, (franquicia) => franquicia.cartas, { nullable: false, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'id_franquicia' })
    franquicia!: FranquiciaType;

    @Column({ type: 'varchar', length: 255 })
    nombre_carta!: string;

    @Column({ type: 'varchar', length: 255})
    rareza!: string;

    @Column({ type: 'varchar', length: 255 })
    set!: string;

    @Column({ type: 'varchar', length: 255 })
    url_imagen!: string;

    @Column({ type: 'varchar', length: 255 })
    url_miniatura!: string;

    @OneToMany(() => CartaDeseada, (cartaDeseada) => cartaDeseada.tipo_carta)
    deseadas!: CartaDeseadaType[];
    
    @OneToMany(() => CartaOfrecida, (cartaOfrecida) => cartaOfrecida.tipo_carta)
    ofrecidas!: CartaOfrecidaType[];
}

