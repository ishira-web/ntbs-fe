import React from "react";
import { CalendarCheck2 } from "lucide-react";

export default function ManageAppointments() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <CalendarCheck2 size={18} /> Manage Appointments
      </h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Donor</th>
              <th className="py-2">Date</th>
              <th className="py-2">Time</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["N. Jayasinghe", "2025-08-28", "10:15", "Scheduled"],
              ["M. Perera", "2025-08-28", "11:00", "Completed"],
            ].map(([n, d, t, s], i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{n}</td>
                <td className="py-2">{d}</td>
                <td className="py-2">{t}</td>
                <td className="py-2">{s}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50">Update</button>
                    <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50">Cancel</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">Hook into your API later.</p>
      </div>
    </div>
  );
}