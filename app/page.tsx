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
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pass");
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const login = async () => {
    const email = prompt("Enter email");
    if (!email) return;
    await supabase.auth.signInWithOtp({ email });
    alert("Check email for login link");
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
    setFiltered(data || []);
  };

  useEffect(() => {
    if (user) loadInspections();
  }, [user]);

  useEffect(() => {
    const filteredData = inspections.filter((i) =>
      `${i.title} ${i.customer} ${i.location}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
    setFiltered(filteredData);
  }, [search, inspections]);

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
        photos: uploaded,
        created_at: new Date()
      }
    ]);

    setTitle("");
    setLocation("");
    setCustomer("");
    setNotes("");
    setPhotos([]);
    setView("list");
    loadInspections();
  };

  if (!user) {
    return (
      <div className="p-10 text-center">
        <button
          onClick={login}
          className="bg-blue-600 text-white p-3 rounded"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 max-w-md mx-auto space-y-4">

      {/* NAV */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setView("list");
            setSelectedInspection(null);
          }}
          className={`p-3 w-full rounded ${
            view === "list" ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          Inspections
        </button>

        <button
          onClick={() => setView("form")}
          className={`p-3 w-full rounded ${
            view === "form" ? "bg-blue-600 text-white" : "bg-white"
          }`}
        >
          New
        </button>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Inspections</h2>
        <button onClick={logout}>Logout</button>
      </div>

      {/* SEARCH */}
      {view === "list" && !selectedInspection && (
        <input
          placeholder="Search inspections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border rounded"
        />
      )}

      {/* FORM */}
      {view === "form" && (
        <div className="bg-white p-4 rounded-xl shadow space-y-3">
          <input placeholder="Customer" value={customer} onChange={(e)=>setCustomer(e.target.value)} className="w-full p-2 border rounded" />
          <input placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full p-2 border rounded" />
          <input placeholder="Location" value={location} onChange={(e)=>setLocation(e.target.value)} className="w-full p-2 border rounded" />
          <select value={status} onChange={(e)=>setStatus(e.target.value)} className="w-full p-2 border rounded">
            <option>Pass</option>
            <option>Fail</option>
            <option>Repair</option>
          </select>
          <textarea placeholder="Notes" value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full p-2 border rounded" />
          <input type="file" multiple onChange={(e)=>setPhotos(Array.from(e.target.files||[]))}/>
          <button onClick={handleSave} className="bg-green-600 text-white p-3 w-full rounded font-bold">
            Save Inspection
          </button>
        </div>
      )}

      {/* DETAIL */}
      {view === "list" && selectedInspection && (
        <div className="bg-white p-4 rounded-xl shadow space-y-3">
          <button onClick={()=>setSelectedInspection(null)}>← Back</button>

          <h2 className="text-xl font-bold">{selectedInspection.title}</h2>
          <p>{selectedInspection.customer}</p>
          <p>{selectedInspection.location}</p>
          <p>{selectedInspection.notes}</p>

          <div className="space-y-2">
            {selectedInspection.photos?.map((p:any,i:number)=>(
              <img key={i} src={p} onClick={()=>setSelectedPhoto(p)} className="rounded"/>
            ))}
          </div>
        </div>
      )}

      {/* LIST */}
      {view === "list" && !selectedInspection && (
        <div className="space-y-3">
          {filtered.map((insp:any)=>(
            <div
              key={insp.id}
              onClick={()=>setSelectedInspection(insp)}
              className="bg-white p-4 rounded-xl shadow cursor-pointer"
            >
              <div className="flex justify-between">
                <b>{insp.title}</b>
                <span>
                  {insp.status === "Pass" ? "✅" :
                   insp.status === "Fail" ? "❌" : "🔧"}
                </span>
              </div>

              <p className="text-sm text-gray-600">{insp.customer}</p>
              <p className="text-sm text-gray-500">{insp.location}</p>

              {insp.created_at && (
                <p className="text-xs text-gray-400">
                  {new Date(insp.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FULLSCREEN PHOTO */}
      {selectedPhoto && (
        <div
          onClick={()=>setSelectedPhoto(null)}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center"
        >
          <img src={selectedPhoto} className="max-h-full max-w-full"/>
        </div>
      )}

    </div>
  );
}