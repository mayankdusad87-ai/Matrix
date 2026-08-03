import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface TaskAttributes {
  id: number;
  title: string;
  description: string;
  startDate: Date | string;
  dueDate: Date | string;
  importanceScore: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  owner: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'description' | 'status' | 'owner' | 'category'> {}

class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public startDate!: Date;
  public dueDate!: Date;
  public importanceScore!: number;
  public status!: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  public owner!: string;
  public category!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    importanceScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    status: {
      type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'On Hold'),
      defaultValue: 'Not Started',
    },
    owner: {
      type: DataTypes.STRING(100),
      defaultValue: 'Unassigned',
    },
    category: {
      type: DataTypes.STRING(100),
      defaultValue: 'General',
    },
  },
  {
    sequelize,
    tableName: 'tasks',
    timestamps: true,
  }
);

export default Task;
