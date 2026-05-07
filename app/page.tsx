"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [view, setView] = useState("dashboard");

  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [customer, setCustomer] = useState("");
  const [worker, setWorker] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pass");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const login = async () => {
    const email = prompt("Enter email");
    if (!email) return;
    await supabase.auth.signInWithOtp({ email });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const loadInspections = async () => {
    const { data } = await supabase.from("inspections").select("*");
    setInspections(data || []);
  };

  useEffect(() => {
    if (user) loadInspections();
  }, [user]);

  const handleSave = async () => {
    let nextYear = "";
    if (dueDate) {
      const d = new Date(dueDate);
      d.setFullYear(d.getFullYear() + 1);
      nextYear = d.toISOString();
    }

    await supabase.from("inspections").insert([
      {
        title,
        location,
        customer,
        worker,
        notes,
        status,
        due_date: dueDate,
        next_due: nextYear
      }
    ]);

    setView("dashboard");
    loadInspections();
  };

  const getStats = () => {
    const total = inspections.length;
    const overdue = inspections.filter(i => new Date(i.due_date) < new Date()).length;
    const pass = inspections.filter(i => i.status === "Pass").length;
    const fail = inspections.filter(i => i.status === "Fail").length;
    return { total, overdue, pass, fail };
  };

  const downloadPDF = (insp: any) => {
    let text = `
Inspection Report

Title: ${insp.title}
Customer: ${insp.customer}
Location: ${insp.location}
Worker: ${insp.worker}

Status: ${insp.status}

Notes:
${insp.notes}

Due: ${insp.due_date}
`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${insp.title}.txt`;
    a.click();
  };

  if (!user) {
    return (
      <div className="p-10 text-center">
        <button onClick={login} className="bg-blue-600 text-white p-3">
          Login
        </button>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="bg-gray-200 min-h-screen p-4 max-w-md mx-auto text-black space-y-4">

      {/* NAV */}
      <div className="flex gap-2">
        <button onClick={()=>setView("dashboard")} className="bg-white p-3 w-full">Dashboard</button>
        <button onClick={()=>setView("form")} className="bg-white p-3 w-full">New</button>
        <button onClick={()=>setView("calendar")} className="bg-white p-3 w-full">Calendar</button>
      </div>

      {/* DASHBOARD */}
      {view === "dashboard" && (
        <>
          <div className="bg-white p-4 rounded shadow">
            <p>Total: {stats.total}</p>
            <p>Overdue: {stats.overdue}</p>
            <p>Pass: {stats.pass}</p>
            <p>Fail: {stats.fail}</p>
          </div>

          {inspections.map((insp:any)=>(
            <div
              key={insp.id}
              className="bg-white p-4 rounded shadow"
              onClick={()=>setSelectedInspection(insp)}
            >
              <b>{insp.title}</b>
              <p>{insp.customer}</p>
              <p>{insp.worker}</p>
              <p>{insp.due_date}</p>

              {new Date(insp.due_date) < new Date() && (
                <p style={{color:"red"}}>OVERDUE</p>
              )}
            </div>
          ))}
        </>
      )}

      {/* DETAIL */}
      {selectedInspection && (
        <div className="bg-white p-4">
          <button onClick={()=>setSelectedInspection(null)}>Back</button>
          <h2>{selectedInspection.title}</h2>
          <p>{selectedInspection.notes}</p>

          <button onClick={()=>downloadPDF(selectedInspection)}>
            Download Report
          </button>
        </div>
      )}

      {/* FORM */}
      {view === "form" && (
        <div className="bg-white p-4 space-y-2">

          <input placeholder="Customer" onChange={e=>setCustomer(e.target.value)} className="border w-full p-2"/>
          <input placeholder="Title" onChange={e=>setTitle(e.target.value)} className="border w-full p-2"/>
          <input placeholder="Location" onChange={e=>setLocation(e.target.value)} className="border w-full p-2"/>

          <input placeholder="Worker" onChange={e=>setWorker(e.target.value)} className="border w-full p-2"/>

          <input type="date" onChange={e=>setDueDate(e.target.value)} className="border w-full p-2"/>

          <select onChange={e=>setStatus(e.target.value)} className="border w-full p-2">
            <option>Pass</option>
            <option>Fail</option>
            <option>Repair</option>
          </select>

          <textarea placeholder="Notes" onChange={e=>setNotes(e.target.value)} className="border w-full p-2"/>

          <button onClick={handleSave} className="bg-green-600 text-white p-3 w-full">
            Save
          </button>
        </div>
      )}

      {/* CALENDAR */}
      {view === "calendar" && (
        <div className="bg-white p-4 rounded shadow">
          {inspections.map((i:any)=>(
            <p key={i.id}>
              {new Date(i.due_date).toLocaleDateString()} — {i.title}
            </p>
          ))}
        </div>
      )}

    </div>
  );
}