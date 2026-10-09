import { Entity, PrimaryColumn, Column } from 'typeorm';
import { TipoCarta } from './tipoCarta.entity.js';
import { OneToMany } from 'typeorm';

@Entity({ name: 'franquicia' })
export class Franquicia {
    @PrimaryColumn({ name: 'id_franquicia', type: 'varchar', length: 255 })
    id_franquicia!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    nombre_franquicia!: string;

    @OneToMany(() => TipoCarta, (tipoCarta) => tipoCarta.franquicia)
    cartas!: TipoCarta[];
}