import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { Greenhouse } from "./greenhouse";

@Table({
  timestamps: false,
  tableName: "readings",
})
export class Reading extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_reading!: number; 

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  air_humidity!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  air_temp!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  soil_humidity!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  sun_incidence!: number;

  // Greenhouse Foreign keys 
  @ForeignKey(() => Greenhouse)
  @Column
  greenhouse_id!: number;

  @BelongsTo(() => Greenhouse)
  greenhouse!: Greenhouse;
}