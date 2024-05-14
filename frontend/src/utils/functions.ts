export function mapDataTypeToInputType(dataType: string): string {
  switch (dataType) {
    case 'integer':
      return 'number';
    case 'character varying':
    case 'text':
      return 'text';
    case 'boolean':
      return 'checkbox';
    case 'date':
      return 'date';
    case 'double precision':
      return 'number';
    default:
      return 'text';
  }
}