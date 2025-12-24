import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Job, TradeRole } from "../utils/api";
import "./Jobs.css";

export default function Jobs() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const queryClient = useQueryClient();

  const { data: jobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list(),
  });

  const { data: tradeRoles } = useQuery({
    queryKey: ["tradeRoles"],
    queryFn: () => api.tradies.roles(),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      clientId: number;
      materials?: string;
      requirements: Array<{ tradeRoleId: number; requiredSlots: number }>;
    }) => api.jobs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Job> }) =>
      api.jobs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.jobs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const requirements: Array<{ tradeRoleId: number; requiredSlots: number }> = [];
    
    tradeRoles?.forEach((role) => {
      const slots = formData.get(`req_${role.id}`);
      if (slots && Number(slots) > 0) {
        requirements.push({
          tradeRoleId: role.id,
          requiredSlots: Number(slots),
        });
      }
    });

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      clientId: Number(formData.get("clientId")),
      materials: formData.get("materials") as string || undefined,
      requirements,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1>Jobs</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Job
        </button>
      </div>

      {(showForm || editing) && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit Job" : "Add Job"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input name="name" defaultValue={editing?.name} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" defaultValue={editing?.description || ""} rows={3} />
              </div>
              <div className="form-group">
                <label>Client</label>
                <select name="clientId" defaultValue={editing?.clientId} required>
                  <option value="">Select a client</option>
                  {clients?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Materials</label>
                <input name="materials" defaultValue={editing?.materials || ""} />
              </div>
              <div className="form-group">
                <label>Requirements (half-day slots per role)</label>
                <div className="requirements-grid">
                  {tradeRoles?.map((role) => (
                    <div key={role.id} className="requirement-item">
                      <label>{role.name}</label>
                      <input
                        type="number"
                        name={`req_${role.id}`}
                        min="0"
                        defaultValue={
                          editing?.requirements.find((r) => r.tradeRoleId === role.id)
                            ?.requiredSlots || 0
                        }
                      />
                    </div>
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
              <th>Client</th>
              <th>Requirements</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs?.map((job) => (
              <tr key={job.id}>
                <td>{job.name}</td>
                <td>{job.client.name}</td>
                <td>
                  {job.requirements.map((r) => (
                    <span key={r.id} className="requirement-badge">
                      {r.tradeRole.name}: {r.requiredSlots} slots
                    </span>
                  ))}
                </td>
                <td>
                  <button onClick={() => setEditing(job)} className="btn-edit">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this job?")) {
                        deleteMutation.mutate(job.id);
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



