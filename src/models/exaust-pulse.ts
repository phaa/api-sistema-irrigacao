import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { Greenhouse } from "./greenhouse";

@Table({
  timestamps: false,
  tableName: "exaust_pulse",
})
export class ExaustPulse extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_exaust_pulse!: number;

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
  inital_temp!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  final_temp!: number;

  // Greenhouse Foreign keys 
  @ForeignKey(() => Greenhouse)
  @Column
  greenhouse_id!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;
}