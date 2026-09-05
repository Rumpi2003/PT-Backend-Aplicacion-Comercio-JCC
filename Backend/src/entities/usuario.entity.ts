import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany ,JoinColumn } from 'typeorm';
import { Comuna } from './comuna.entity.js';
import { Comuna as ComunaType } from './comuna.entity.js';
import { Reseña } from './reseña.entity.js';
import { Reseña as ReseñaType } from './reseña.entity.js';
import { Transaccion } from './transaccion.entity.js';
import { Transaccion as TransaccionType } from './transaccion.entity.js';
import { Reporte } from './reporte.entity.js';
import { Reporte as ReporteType } from './reporte.entity.js';
import { Mensaje } from './mensaje.entity.js';
import { Mensaje as MensajeType } from './mensaje.entity.js';
import { CartaDeseada } from './cartaDeseada.entity.js';
import { CartaDeseada as CartaDeseadaType } from './cartaDeseada.entity.js';
import { CartaOfrecida } from './cartaOfrecida.entity.js';
import { CartaOfrecida as CartaOfrecidaType } from './cartaOfrecida.entity.js';

@Entity({ name: 'usuario' })
export class Usuario {
    @PrimaryGeneratedColumn({ name: 'id_usuario', type: 'int' })
    id_usuario!: number;

    @ManyToOne(() => Comuna, (comuna) => comuna.usuarios, { eager: true, nullable: false })
    @JoinColumn({ name: 'id_comuna' })
    comuna!: ComunaType;

    @Column({ type: 'varchar', length: 255 })
    correo!: string;

    @Column({ type: 'varchar', length: 255 })
    contraseña!: string;

    @Column({ type: 'varchar', length: 255 })
    nombre_usuario!: string;

    @Column({ type: 'varchar', length: 255 })
    descripcion_perfil!: string;

    @Column({ type: 'varchar', length: 255 })
    contacto!: string;

    @Column({ type: 'float', default: 0 })
    puntuacion_promedio!: number;

    @Column({ type: 'int', default: 0 })
    radio_geo!: number;

    @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
    ultimas_coordenadas!: string;

    @Column({ type: 'boolean', default: false })
    modo_geo_activado!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    ultima_update_geo!: Date;

    @Column({ type: 'boolean', default: true })
    visibilidad_perfil!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    fecha_registro!: Date;

    @OneToMany(() => Reseña, (reseña) => reseña.usuario_reseñador)
    reseñas_realizadas!: ReseñaType[];

    @OneToMany(() => Reseña, (reseña) => reseña.usuario_reseñado)
    reseñas_recibidas!: ReseñaType[];

    @OneToMany(() => Transaccion, (transaccion) => transaccion.usuario_1)
    transacciones_1!: TransaccionType[];

    @OneToMany(() => Transaccion, (transaccion) => transaccion.usuario_2)
    transacciones_2!: TransaccionType[];

    @OneToMany(() => Reporte, (reporte) => reporte.usuario_reportante)
    reportes_realizados!: ReporteType[];

    @OneToMany(() => Reporte, (reporte) => reporte.usuario_reportado)
    reportes_recibidos!: ReporteType[];

    @OneToMany(() => Mensaje, (mensaje) => mensaje.emisor)
    mensajes_enviados!: MensajeType[];

    @OneToMany(() => CartaDeseada, (cartaDeseada) => cartaDeseada.usuario)
    cartas_deseadas!: CartaDeseadaType[];

    @OneToMany(() => CartaOfrecida, (cartaOfrecida) => cartaOfrecida.usuario)
    cartas_ofrecidas!: CartaOfrecidaType[];
}
