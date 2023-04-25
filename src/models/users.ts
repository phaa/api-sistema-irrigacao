import { Table, Model, Column, DataType } from "sequelize-typescript";

@Table({
  timestamps: false,
  tableName: "users",
})
export class Users extends Model {
  /**@Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  user_id!: number; */

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING(11),
    allowNull: false,
  })
  cpf!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  num_cnh!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  validade_cnh!: string;

  @Column({
    type: DataType.STRING(15),
    allowNull: false,
  })
  telephone!: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  email!: string;
}