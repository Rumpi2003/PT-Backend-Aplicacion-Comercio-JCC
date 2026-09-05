import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Usuario as UsuarioType } from './usuario.entity.js';


@Entity({ name: 'comuna' })
export class Comuna {
    @PrimaryGeneratedColumn({ name: 'id_comuna', type: 'int' })
    id_comuna!: number;

    @Column({ type: 'varchar', length: 255 })
    nombre_comuna!: string;

    @Column({ type: 'varchar', length: 255 })
    region!: string;

    @OneToMany(() => Usuario, (usuario) => usuario.comuna)
    usuarios!: UsuarioType[];
}