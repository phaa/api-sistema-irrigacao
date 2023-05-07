import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { Greenhouse } from "./greenhouse";

@Table({
  timestamps: false,
  tableName: "watering_pulse",
})
export class WateringPulse extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_watering_pulse!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  start!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  end!: string;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  inital_humidity!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  final_humidity!: number;

  // Greenhouse Foreign keys 
  @ForeignKey(() => Greenhouse)
  @Column
  greenhouse_id!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;
}