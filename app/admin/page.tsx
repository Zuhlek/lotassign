import prisma from "@/lib/db";
import { Prisma, User, UserRole } from "@prisma/client";
import { createUser, updateUser, deleteUser } from "@/lib/userActions";
import CrudDataGrid from "@/components/crud-data-grid/crud-data-grid";
import { GridColDef } from "@mui/x-data-grid";

const AdminPage = async () => {
  const users: User[] = await prisma.user.findMany();

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 250 },
    { field: "name", headerName: "Name", width: 150, editable: true },
    { field: "email", headerName: "Email", width: 150, editable: true },
    { field: "emailVerified", headerName: "Email Verified", width: 150, editable: true, type: "dateTime" },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      flex: 1,
      editable: true,
      type: "singleSelect",
      valueOptions: Object.values(UserRole).map((type) => ({
        value: type,
        label: type,
      })),
    },
  ];

  return (
    <div>
      <CrudDataGrid<User>
        title="Users"
        rows={users}
        columns={columns}
        createAction={createUser}
        updateAction={updateUser}
        deleteAction={deleteUser}
      ></CrudDataGrid>
    </div>
  );
};

export default AdminPage;
