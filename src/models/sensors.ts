import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { Greenhouse } from "./greenhouse";

@Table({
  timestamps: false,
  tableName: "sensors",
})
export class Sensor extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_sensor!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  pin!: number;

  @Column({
    type: DataType.STRING(45),
    allowNull: false,
  })
  description!: number;

  // Greenhouse Foreign keys 
  @ForeignKey(() => Greenhouse)
  @Column
  greenhouse_id!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;
}