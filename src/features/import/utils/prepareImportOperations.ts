import { CellData, ColumnKind, Sheet } from './types';

export type ZetkinPersonImportOp = {
  fields?: Record<string, CellData>;
  op: 'person.import';
  organizations?: number | null;
  tags?: number[];
};

export default function prepareImportOperations(
  configuredSheet: Sheet
): ZetkinPersonImportOp[] {
  const result: ZetkinPersonImportOp[] = [];

  configuredSheet.columns.forEach((column, colIdx) => {
    if (column.selected) {
      configuredSheet.rows.forEach((row, rowIdx) => {
        const rowIndex = configuredSheet.firstRowIsHeaders
          ? rowIdx - 1
          : rowIdx;

        if (configuredSheet.firstRowIsHeaders && rowIdx === 0) {
          return;
        }

        //Id column
        if (column.kind === ColumnKind.ID_FIELD) {
          result.push({
            fields: {
              [`${column.idField}`]: row.data[colIdx],
            },
            op: 'person.import',
          });
        }

        //fields
        if (column.kind === ColumnKind.FIELD) {
          if (!result[rowIndex]) {
            result.push({ fields: {}, op: 'person.import' });
          }
          if (row.data[colIdx]) {
            result[rowIndex].fields![column.field] = row.data[colIdx];
          }
        }

        //tags
        if (column.kind === ColumnKind.TAG) {
          if (!result[rowIndex]) {
            result.push({ op: 'person.import', tags: [] });
          }
          column.mapping.forEach((item) => {
            if (item.value === row.data[colIdx]) {
              result[rowIndex].tags = column.mapping[rowIndex].tagIds;
            }
          });
        }
        //orgs
        if (column.kind === ColumnKind.ORGANIZATION) {
          if (!result[rowIndex]) {
            result.push({
              op: 'person.import',
              organizations: null,
            });
          }
          column.mapping.forEach((item) => {
            if (item.value === row.data[colIdx]) {
              result[rowIndex].organizations = column.mapping[rowIndex].orgId;
            }
          });
        }
      });
    }
  });
  return result;
}
