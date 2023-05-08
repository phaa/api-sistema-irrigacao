import { Table, Model, Column, DataType } from "sequelize-typescript";

@Table({
  timestamps: false,
  tableName: "external_readings",
})
export class ExternalReading extends Model {
  @Column({
    type: DataType.INTEGER,
  })
  id_external_reading!: number;

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
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  rain_incidence!: boolean;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  reservoir_volume!: number;
}