import React from "react";
import { Users, Plus } from "lucide-react";

export default function ManageUsers() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Users size={18} /> Manage Users
        </h1>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Admin User", "admin@example.com", "admin"],
              ["Matara Hospital", "matara@hospital.lk", "hospital"],
            ].map(([n, e, r], i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{n}</td>
                <td className="py-2">{e}</td>
                <td className="py-2 capitalize">{r}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50">Edit</button>
                    <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50">Disable</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">
          Placeholder data. Wire to your API or Inertia endpoint later.
        </p>
      </div>
    </div>
  );
}