import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, TradePerson } from "../utils/api";
import "./Tradies.css";

type SortColumn = "name" | "email" | "roles";
type SortDirection = "asc" | "desc";

export default function Tradies() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TradePerson | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const queryClient = useQueryClient();

  const { data: tradies } = useQuery({
    queryKey: ["tradies"],
    queryFn: () => api.tradies.list(),
  });

  const sortedTradies = useMemo(() => {
    if (!tradies) return [];
    return [...tradies].sort((a, b) => {
      let aVal: string;
      let bVal: string;
      
      if (sortColumn === "name") {
        aVal = a.user.name.toLowerCase();
        bVal = b.user.name.toLowerCase();
      } else if (sortColumn === "email") {
        aVal = a.user.email.toLowerCase();
        bVal = b.user.email.toLowerCase();
      } else {
        aVal = a.roles.map(r => r.tradeRole.name).sort().join(", ").toLowerCase();
        bVal = b.roles.map(r => r.tradeRole.name).sort().join(", ").toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tradies, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return <span className="sort-indicator">⇅</span>;
    return <span className="sort-indicator active">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  const { data: tradeRoles } = useQuery({
    queryKey: ["tradeRoles"],
    queryFn: () => api.tradies.roles(),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
  });

  const availableUsers = users?.filter(
    (u) => u.role === "TradePerson" && !tradies?.some((t) => t.userId === u.id && !t.deletedAt),
  );

  const createMutation = useMutation({
    mutationFn: (data: { userId: number; tradeRoleIds: number[] }) =>
      api.tradies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradies"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { tradeRoleIds: number[] } }) =>
      api.tradies.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradies"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.tradies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradies"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userId = Number(formData.get("userId"));
    const roleIds = Array.from(formData.getAll("tradeRoleIds")).map(Number);

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { tradeRoleIds: roleIds } });
    } else {
      createMutation.mutate({ userId, tradeRoleIds: roleIds });
    }
  };

  return (
    <div className="tradies-page">
      <div className="page-header">
        <h1>Tradies</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Tradie
        </button>
      </div>

      {(showForm || editing) && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit Tradie" : "Add Tradie"}</h2>
            <form onSubmit={handleSubmit}>
              {!editing && (
                <div className="form-group">
                  <label>User</label>
                  <select name="userId" required>
                    <option value="">Select a user</option>
                    {availableUsers?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Trade Roles</label>
                <div className="checkbox-group">
                  {tradeRoles?.map((role) => (
                    <label key={role.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        name="tradeRoleIds"
                        value={role.id}
                        defaultChecked={editing?.roles.some((r) => r.tradeRole.id === role.id)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("name")}>
                Name {getSortIndicator("name")}
              </th>
              <th className="sortable" onClick={() => handleSort("email")}>
                Email {getSortIndicator("email")}
              </th>
              <th className="sortable" onClick={() => handleSort("roles")}>
                Trade Roles {getSortIndicator("roles")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTradies.map((tradie) => (
              <tr key={tradie.id}>
                <td>{tradie.user.name}</td>
                <td>{tradie.user.email}</td>
                <td>{tradie.roles.map((r) => r.tradeRole.name).join(", ")}</td>
                <td>
                  <button onClick={() => setEditing(tradie)} className="btn-edit">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this tradie?")) {
                        deleteMutation.mutate(tradie.id);
                      }
                    }}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



