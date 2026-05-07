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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("list");

  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pass");
  const [dueDate, setDueDate] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);

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
    const { data } = await supabase
      .from("inspections")
      .select("*")
      .order("id", { ascending: false });

    setInspections(data || []);
  };

  useEffect(() => {
    if (user) loadInspections();
  }, [user]);

  const uploadPhotos = async (files: any[]) => {
    const urls = [];

    for (let file of files) {
      const name = `${Date.now()}-${file.name}`;
      await supabase.storage.from("inspection-photos").upload(name, file);
      const { data } = supabase.storage
        .from("inspection-photos")
        .getPublicUrl(name);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const handleSave = async () => {
    const uploaded = await uploadPhotos(photos);

    await supabase.from("inspections").insert([
      {
        title,
        location,
        customer,
        notes,
        status,
        due_date: dueDate,
        photos: uploaded
      }
    ]);

    setTitle("");
    setLocation("");
    setCustomer("");
    setNotes("");
    setPhotos([]);
    setDueDate("");

    setView("list");
    loadInspections();
  };

  const getDueStatus = (date: string) => {
    if (!date) return "";

    const today = new Date();
    const due = new Date(date);
    const diff = (due.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (diff < 0) return "OVERDUE 🔴";
    if (diff < 14) return "Due Soon ⚠️";

    return "";
  };

  const filtered = inspections.filter((i) => {
    const matchesSearch =
      `${i.title} ${i.customer} ${i.location}`
        .toLowerCase()
        .includes(search.toLowerCase());

    if (filter === "pass") return matchesSearch && i.status === "Pass";
    if (filter === "fail") return matchesSearch && i.status === "Fail";
    if (filter === "repair") return matchesSearch && i.status === "Repair";
    if (filter === "due")
      return matchesSearch && getDueStatus(i.due_date).includes("OVERDUE");

    return matchesSearch;
  });

  if (!user) {
    return (
      <div className="p-10 text-center">
        <button onClick={login} className="bg-blue-600 text-white p-3 rounded">
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen p-4 max-w-md mx-auto space-y-4 text-black">

      {/* NAV */}
      <div className="flex gap-2">
        <button
          onClick={()=>{setView("list");setSelectedInspection(null);}}
          className={`p-3 w-full rounded ${view==="list"?"bg-blue-600 text-white":"bg-white text-black"}`}
        >
          Inspections
        </button>

        <button
          onClick={()=>setView("form")}
          className={`p-3 w-full rounded ${view==="form"?"bg-blue-600 text-white":"bg-white text-black"}`}
        >
          New
        </button>
      </div>

      {/* SEARCH */}
      {view==="list" && !selectedInspection && (
        <>
          <input
            placeholder="Search inspections..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full p-3 border border-gray-500 rounded text-black"
          />

          <div className="flex gap-2 text-sm font-medium">
            <button onClick={()=>setFilter("all")}>All</button>
            <button onClick={()=>setFilter("pass")}>Pass</button>
            <button onClick={()=>setFilter("fail")}>Fail</button>
            <button onClick={()=>setFilter("repair")}>Repair</button>
            <button onClick={()=>setFilter("due")}>Overdue</button>
          </div>
        </>
      )}

      {/* FORM */}
      {view==="form" && (
        <div className="bg-white p-4 rounded-xl shadow space-y-3">

          {["Customer", "Title", "Location"].map((label, i)=>(
            <input
              key={i}
              placeholder={label}
              value={i===0?customer:i===1?title:location}
              onChange={(e)=>
                i===0?setCustomer(e.target.value):
                i===1?setTitle(e.target.value):
                setLocation(e.target.value)}
              className="w-full p-3 border border-gray-500 rounded text-black"
            />
          ))}

          <input type="date" value={dueDate}
            onChange={(e)=>setDueDate(e.target.value)}
            className="w-full p-3 border border-gray-500 rounded text-black" />

          <select value={status}
            onChange={(e)=>setStatus(e.target.value)}
            className="w-full p-3 border border-gray-500 rounded text-black">
            <option>Pass</option>
            <option>Fail</option>
            <option>Repair</option>
          </select>

          <textarea placeholder="Notes"
            value={notes}
            onChange={(e)=>setNotes(e.target.value)}
            className="w-full p-3 border border-gray-500 rounded text-black"/>

          <input type="file" multiple onChange={(e)=>setPhotos(Array.from(e.target.files||[]))}/>

          <button onClick={handleSave} className="bg-green-600 text-white p-3 w-full rounded font-bold">
            Save Inspection
          </button>

        </div>
      )}

      {/* DETAIL */}
      {selectedInspection && (
        <div className="bg-white p-4 rounded-xl shadow space-y-2">
          <button onClick={()=>setSelectedInspection(null)}>← Back</button>

          <h2 className="text-xl font-bold">{selectedInspection.title}</h2>
          <p>{selectedInspection.customer}</p>
          <p>{selectedInspection.location}</p>
          <p>{selectedInspection.notes}</p>

          {selectedInspection.due_date && (
            <p className="font-bold">{getDueStatus(selectedInspection.due_date)}</p>
          )}

          {selectedInspection.photos?.map((p:any,i:number)=>(
            <img key={i} src={p} onClick={()=>setSelectedPhoto(p)} className="rounded" />
          ))}
        </div>
      )}

      {/* LIST */}
      {!selectedInspection && view==="list" && (
        <div className="space-y-3">
          {filtered.map((insp:any)=>(
            <div key={insp.id}
              onClick={()=>setSelectedInspection(insp)}
              className="bg-white p-4 rounded-xl shadow cursor-pointer">

              <div className="flex justify-between">
                <b className="text-black text-lg">{insp.title}</b>
                <span>
                  {insp.status==="Pass"?"✅":insp.status==="Fail"?"❌":"🔧"}
                </span>
              </div>

              <p className="text-black font-medium">{insp.customer}</p>
              <p className="text-gray-700">{insp.location}</p>

              {insp.due_date && (
                <p className="text-red-600 font-bold">
                  {getDueStatus(insp.due_date)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PHOTO FULLSCREEN */}
      {selectedPhoto && (
        <div onClick={()=>setSelectedPhoto(null)}
          className="fixed inset-0 bg-black flex items-center justify-center">
          <img src={selectedPhoto} className="max-w-full max-h-full"/>
        </div>
      )}

    </div>
  );
}