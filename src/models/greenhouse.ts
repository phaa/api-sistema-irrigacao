import { Table, Model, Column, DataType, HasMany } from "sequelize-typescript";
import { Reading } from "./reading";

@Table({
  timestamps: false,
  tableName: "greenhouses",
})
export class Greenhouse extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_greenhouse!: number; 

  @Column({
    type: DataType.STRING(70),
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  irrigating!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at!: string;

  @Column({
    type: DataType.ENUM('automático', 'manual', 'agendameto'),
    allowNull: false,
  })
  operation_mode!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  ideal_air_temp!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  ideal_air_humidity!: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  ideal_soil_humidity!: number;

  // Foreign keys
  @HasMany(() => Reading)
  readings!: Reading[];
}