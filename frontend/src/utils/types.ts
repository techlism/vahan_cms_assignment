export enum AttributeType {
  VARCHAR = "VARCHAR",
  INTEGER = "INTEGER",
  TEXT = "TEXT",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  FLOAT = "FLOAT",
}

export enum AttributeConstraint {
  NOT_NULL = "NOT NULL",
  NONE = "",
  UNIQUE = "UNIQUE",
  NOT_NULL_UNIQUE = "NOT NULL UNIQUE",
}

export type Attribute = {
  name: string;
  type: AttributeType;
  constraint: AttributeConstraint;
  isPrimaryKey: boolean;
};

export type SchemaField = {
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
  is_nullable: "YES" | "NO";
  column_default: string | null;
};
