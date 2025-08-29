import React from "react";
import { Building2, Plus } from "lucide-react";

export default function ManageHospitals() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Building2 size={18} /> Manage Hospitals
        </h1>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
          <Plus size={16} /> Add Hospital
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Name</th>
              <th className="py-2">District</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Colombo National Hospital", "Colombo", "Active"],
              ["Kandy Teaching Hospital", "Kandy", "Active"],
            ].map(([n, d, s], i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{n}</td>
                <td className="py-2">{d}</td>
                <td className="py-2">{s}</td>
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
        <p className="mt-3 text-xs text-gray-500">Replace with real data later.</p>
      </div>
    </div>
  );
}