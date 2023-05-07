import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { Greenhouse } from "./greenhouse";

@Table({
  timestamps: false,
  tableName: "watering_plan",
})
export class WateringPlan extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_watering_plan!: number;

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
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  active!: boolean;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  water_amount!: number;

  // Greenhouse Foreign keys 
  @ForeignKey(() => Greenhouse)
  @Column
  greenhouse_id!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;
}