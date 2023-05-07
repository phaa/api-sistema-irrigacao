import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { Greenhouse } from "./greenhouse";

@Table({
  timestamps: false,
  tableName: "sensors_air",
})
export class SensorsAir extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_air_sensor!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  pin!: number;

  // Greenhouse Foreign keys 
  @ForeignKey(() => Greenhouse)
  @Column
  greenhouse_id!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;
}