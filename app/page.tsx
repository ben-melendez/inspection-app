"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
``
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [inspections, setInspections] = useState<any[]>([]);
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
    alert("Check your email for login link");
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

      await supabase.storage
        .from("inspection-photos")
        .upload(name, file);

      const { data } = supabase.storage
        .from("inspection-photos")
        .getPublicUrl(name);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const handleSave = async () => {
    if (!user) return;

    const uploaded = await uploadPhotos(photos);

    await supabase.from("inspections").insert([
      {
        title,
        location,
        customer,
        notes,
        status,
        photos: uploaded,
        user_id: user.id
      }
    ]);

    setTitle("");
    setLocation("");
    setCustomer("");
    setNotes("");
    setPhotos([]);

    loadInspections();
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <h2>Login Required</h2>
        <button onClick={login} className="bg-blue-500 text-white p-3 mt-4">
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 max-w-md mx-auto space-y-4">
      <div className="flex justify-between">
        <h2 className="font-bold text-lg">Inspections</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="bg-white p-3 rounded-xl space-y-2 shadow">
        <input
          placeholder="Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="w-full p-2 border"
        />

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border"
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 border"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border"
        >
          <option>Pass</option>
          <option>Fail</option>
          <option>Repair</option>
        </select>

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border"
        />

        <input
          type="file"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files || []))}
        />

        <button
          onClick={handleSave}
          className="bg-green-500 text-white p-3 w-full"
        >
          Save Inspection
        </button>
      </div>

      {inspections.map((insp) => (
        <div key={insp.id} className="bg-white p-3 rounded-xl shadow">
          <b>{insp.title}</b>
          <p>{insp.customer}</p>
          <p>{insp.location}</p>
          <p>{insp.notes}</p>

          <div className="grid grid-cols-3 gap-1">
            {insp.photos?.map((p: any, i: number) => (
              <img key={i} src={p} className="rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
