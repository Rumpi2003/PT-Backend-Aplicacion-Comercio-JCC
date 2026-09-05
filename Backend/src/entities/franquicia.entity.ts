import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TipoCarta } from './tipoCarta.entity.js';
import { OneToMany } from 'typeorm';

@Entity({ name: 'franquicia' })
export class Franquicia {
    @PrimaryGeneratedColumn({ name: 'id_franquicia', type: 'int' })
    id_franquicia!: number;

    @Column({ type: 'varchar', length: 255 })
    nombre_franquicia!: string;

    @OneToMany(() => TipoCarta, (tipoCarta) => tipoCarta.franquicia)
    cartas!: TipoCarta[];
}