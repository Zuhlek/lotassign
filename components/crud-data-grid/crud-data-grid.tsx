"use client";
import * as React from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  GridRowsProp,
  DataGrid,
  GridColDef,
  GridRowModel,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import CustomToolbar from "./crud-data-grid-toolbar";

interface CrudDataGridProps<T> {
  title: string;
  rows: GridRowsProp;
  columns: GridColDef[];
  onRowClick?: (row: GridRowModel) => void;
  createAction?: (data: any) => Promise<T>;
  updateAction?: (data: any) => Promise<T>;
  deleteAction?: (data: any) => Promise<void>;
}

export default function CrudDataGrid<T>({ rows, columns = [], onRowClick, createAction, updateAction, deleteAction }: CrudDataGridProps<T>) {
  const [data, setData] = useState<GridRowsProp>(rows);

  useEffect(() => {
    setData(rows);
  }, [rows]);

  const handleCreate = async () => {
    const newRow: GridRowModel = {};
    if (createAction) {
      const newData = await createAction(newRow as T);
      setData((oldRows) => [...oldRows, { ...newData, isNew: true }] as readonly GridRowModel[]);
    }
  };

  const handleUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    if (updateAction) {
      const updatedData = await updateAction(newRow as T);
      const mappedData = data.map((row) => (row.id === newRow.id ? updatedData : row));
      setData(() => [...mappedData] as readonly GridRowModel[]);
      return updatedData;
    }
    return oldRow;
  };

  const handleDelete = async (row: GridRowModel) => {
    if (deleteAction) {
      await deleteAction(row.id);
      const newData = data.filter((r) => r.id !== row.id);
      setData(() => [...newData] as readonly GridRowModel[]);
    }
  };

  const handleUpdateError = (error: any) => {
    console.error("Error updating row:", error);
  };

  const columnsWithActions: GridColDef[] = [
    ...columns,
    {
      field: "actions",
      headerName: "Actions",
      align: "right",
      headerAlign: "right",
      cellClassName: "actions",
      type: "actions",
      editable: false,
      getActions({ row }) {
        return [
          <GridActionsCellItem key={row.id + "-edit"} icon={<DeleteIcon />} label="Delete" onClick={() => handleDelete(row)} color="inherit" />,
        ];
      },
    },
  ];

  return (
    <div style={{ minWidth: 0 }}>
      <DataGrid
        rows={data}
        columns={columnsWithActions}
        processRowUpdate={handleUpdate}
        onRowClick={onRowClick}
        onProcessRowUpdateError={handleUpdateError}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 25,
            },
          },
        }}
        disableRowSelectionOnClick
        autoHeight
        slots={{ toolbar: () => <CustomToolbar handleCreate={handleCreate}/> }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
      />
    </div>
  );
}