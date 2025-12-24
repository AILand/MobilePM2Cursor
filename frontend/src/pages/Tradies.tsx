import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, TradePerson, User } from "../utils/api";
import "./Tradies.css";

export default function Tradies() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TradePerson | null>(null);
  const queryClient = useQueryClient();

  const { data: tradies } = useQuery({
    queryKey: ["tradies"],
    queryFn: () => api.tradies.list(),
  });

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
              <th>Name</th>
              <th>Email</th>
              <th>Trade Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tradies?.map((tradie) => (
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



