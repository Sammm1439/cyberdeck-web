"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Section =
  | "Dashboard"
  | "Wardrobe"
  | "Study"
  | "Integrations"
  | "Device";

type Clothing = {
  id: number;
  name: string;
  category: string;
  image_url: string | null;
  created_at: string;
};

export default function Home() {
  const [active, setActive] = useState<Section>("Dashboard");

  const navItems: Section[] = [
    "Dashboard",
    "Wardrobe",
    "Study",
    "Integrations",
    "Device",
  ];

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="w-64 border-r border-white/10 bg-[#0b0e14] p-6">

          <div className="mb-10">
            <p className="text-xs tracking-[0.28em] text-white/40">
              THE NEIGHBOURHOOD LABS
            </p>

            <h1 className="mt-2 text-2xl font-semibold">
              CYBERDECK
            </h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`w-full rounded-xl px-4 py-3 text-left transition ${
                  active === item
                    ? "bg-white text-black"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

        </aside>


        {/* MAIN CONTENT */}
        <section className="flex-1 p-8 lg:p-10">

          <header className="mb-10">
            <p className="text-sm uppercase tracking-[0.25em] text-white/35">
              Cyberdeck Control
            </p>

            <h2 className="mt-2 text-4xl font-semibold">
              {active}
            </h2>
          </header>

          {active === "Dashboard" && <Dashboard />}
          {active === "Wardrobe" && <Wardrobe />}
          {active === "Study" && <Study />}
          {active === "Integrations" && <Integrations />}
          {active === "Device" && <Device />}

        </section>

      </div>
    </main>
  );
}


// ======================================================
// DASHBOARD
// ======================================================

function Dashboard() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

      <Card
        label="WARDROBE"
        title="Supabase"
        subtitle="Cloud connected"
      />

      <Card
        label="STUDY"
        title="02:14:37"
        subtitle="Total focus time"
      />

      <Card
        label="SPOTIFY"
        title="Not connected"
        subtitle="Coming later"
      />

      <Card
        label="DEVICE"
        title="ESP32"
        subtitle="Cyberdeck controller"
      />

    </div>
  );
}


// ======================================================
// WARDROBE
// ======================================================
async function compressForCyberdeck(file: File): Promise<Blob> {
  const image = new Image();

  const imageUrl = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = imageUrl;
  });

  const MAX_WIDTH = 320;
  const MAX_HEIGHT = 240;

  let width = image.width;
  let height = image.height;

  const scale = Math.min(
    MAX_WIDTH / width,
    MAX_HEIGHT / height,
    1
  );

  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    URL.revokeObjectURL(imageUrl);
    throw new Error("Canvas unavailable");
  }

  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  URL.revokeObjectURL(imageUrl);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      resolve,
      "image/jpeg",
      0.65
    );
  });

  if (!blob) {
    throw new Error("Image compression failed");
  }

  return blob;
}
function Wardrobe() {

  const [clothes, setClothes] = useState<Clothing[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Top");

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  // ====================================================
  // LOAD CLOTHES
  // ====================================================

  async function loadClothes() {

    const { data, error } =
      await supabase
        .from("clothes")
        .select("*")
        .order(
          "created_at",
          { ascending: false }
        );


    if (error) {

      console.error(error);

      setMessage(
        "Could not load wardrobe."
      );

      return;
    }


    setClothes(data || []);
  }


  useEffect(() => {
    loadClothes();
  }, []);


  // ====================================================
  // ADD CLOTHING
  // ====================================================

  async function addClothing() {

    if (!name.trim()) {

      setMessage(
        "Enter a clothing name."
      );

      return;
    }


    setLoading(true);

    setMessage("");


    let imageUrl:
      string | null = null;


    // ================================================
    // UPLOAD IMAGE
    // ================================================

    if (imageFile) {

      let cyberdeckImage: Blob;

try {
  cyberdeckImage =
    await compressForCyberdeck(imageFile);
} catch (error) {
  console.error(error);

  setMessage(
    "Could not prepare image for Cyberdeck."
  );

  setLoading(false);
  return;
}

console.log(
  "Original:",
  Math.round(imageFile.size / 1024),
  "KB"
);

console.log(
  "Cyberdeck:",
  Math.round(cyberdeckImage.size / 1024),
  "KB"
);

const fileName =
  `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.jpg`;


      const {
        error: uploadError
      } =
        await supabase.storage
          .from("clothes")
          .upload(
            fileName,
            cyberdeckImage,
            {
              contentType: "image/jpeg"
            }
          );


      if (uploadError) {

        console.error(
          uploadError
        );

        setMessage(
          "Image upload failed: " +
          uploadError.message
        );

        setLoading(false);

        return;
      }


      const { data } =
        supabase.storage
          .from("clothes")
          .getPublicUrl(
            fileName
          );


      imageUrl =
        data.publicUrl;
    }


    // ================================================
    // SAVE DATABASE ROW
    // ================================================

    const { error } =
      await supabase
        .from("clothes")
        .insert({
          name:
            name.trim(),

          category:
            category,

          image_url:
            imageUrl,
        });


    if (error) {

      console.error(error);

      setMessage(
        "Could not save clothing: " +
        error.message
      );

      setLoading(false);

      return;
    }


    // ================================================
    // RESET FORM
    // ================================================

    setName("");

    setCategory("Top");

    setImageFile(null);

    setShowForm(false);


    await loadClothes();


    setMessage(
      "Clothing added successfully."
    );


    setLoading(false);
  }


  // ====================================================
  // REMOVE CLOTHING
  // ====================================================

  async function removeClothing(
    item: Clothing
  ) {

    const confirmed =
      window.confirm(
        `Remove ${item.name}?`
      );


    if (!confirmed)
      return;


    const { error } =
      await supabase
        .from("clothes")
        .delete()
        .eq(
          "id",
          item.id
        );


    if (error) {

      console.error(error);

      setMessage(
        "Could not remove clothing."
      );

      return;
    }


    await loadClothes();


    setMessage(
      "Clothing removed."
    );
  }


  // ====================================================
  // UI
  // ====================================================

  return (
    <div>

      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h3 className="text-2xl font-medium">
            Your wardrobe
          </h3>

          <p className="mt-1 text-sm text-white/45">
            Clothes stored in your
            Cyberdeck database.
          </p>

        </div>


        <button
          onClick={() => {
            setShowForm(true);
            setMessage("");
          }}
          className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
        >
          + Add Clothing
        </button>

      </div>


      {/* MESSAGE */}

      {message && (

        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          {message}
        </div>

      )}


      {/* ADD CLOTHING FORM */}

      {showForm && (

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6">


          <div className="mb-6 flex items-center justify-between">

            <h3 className="text-xl font-medium">
              Add Clothing
            </h3>


            <button
              onClick={() => {

                setShowForm(false);

                setName("");

                setCategory("Top");

                setImageFile(null);

              }}
              className="text-sm text-white/40 hover:text-white"
            >
              Close
            </button>

          </div>


          <div className="grid gap-5 md:grid-cols-2">


            {/* NAME */}

            <div>

              <label className="mb-2 block text-sm text-white/50">
                Name
              </label>


              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Black oversized tee"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
              />

            </div>


            {/* CATEGORY */}

            <div>

              <label className="mb-2 block text-sm text-white/50">
                Category
              </label>


              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#0b0e14] px-4 py-3 outline-none"
              >

                <option value="Top">
                  Top
                </option>

                <option value="Bottom">
                  Bottom
                </option>

                <option value="Shoes">
                  Shoes
                </option>

              </select>

            </div>


            {/* IMAGE */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm text-white/50">
                Clothing Image
              </label>


              <input
                type="file"

                accept="
                  image/jpeg,
                  image/png,
                  image/webp
                "

                onChange={(e) => {

                  const file =
                    e.target
                      .files?.[0];


                  if (file) {

                    setImageFile(
                      file
                    );
                  }

                }}

                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/60"
              />


              {imageFile && (

                <div className="mt-4">


                  <p className="mb-3 text-xs text-white/40">
                    Selected:
                    {" "}
                    {imageFile.name}
                  </p>


                  <img
                    src={
                      URL.createObjectURL(
                        imageFile
                      )
                    }

                    alt="Preview"

                    className="h-52 w-full max-w-sm rounded-xl object-cover"
                  />

                </div>

              )}

            </div>

          </div>


          {/* SAVE BUTTON */}

          <button
            onClick={
              addClothing
            }

            disabled={
              loading
            }

            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading
              ? "Uploading..."
              : "Save Clothing"}

          </button>

        </div>

      )}


      {/* EMPTY STATE */}

      {clothes.length === 0 ? (

        <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-white/40">

          No clothes yet.

          <br />

          Add your first item.

        </div>

      ) : (

        // ==============================================
        // CLOTHING GRID
        // ==============================================

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {clothes.map(
            (item) => (

              <div
                key={item.id}

                className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20"
              >


                {/* IMAGE */}

                {item.image_url ? (

                  <img
                    src={
                      item.image_url
                    }

                    alt={
                      item.name
                    }

                    className="mb-5 h-52 w-full rounded-xl object-cover"
                  />

                ) : (

                  <div className="mb-5 flex h-52 items-center justify-center rounded-xl bg-white/[0.05] text-sm text-white/25">

                    No image

                  </div>

                )}


                {/* CATEGORY */}

                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">

                  {item.category}

                </p>


                {/* NAME */}

                <h4 className="mt-2 text-xl font-medium">

                  {item.name}

                </h4>


                {/* REMOVE */}

                <button
                  onClick={() =>
                    removeClothing(
                      item
                    )
                  }

                  className="mt-5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-red-400/30 hover:text-red-300"
                >

                  Remove

                </button>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}


// ======================================================
// STUDY
// ======================================================

function Study() {

  return (

    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">

      <p className="text-xs tracking-[0.2em] text-white/40">
        STUDY
      </p>


      <h3 className="mt-4 text-4xl font-semibold">
        02:14:37
      </h3>


      <p className="mt-2 text-sm text-white/40">
        Total Cyberdeck focus time
      </p>

    </div>

  );
}


// ======================================================
// INTEGRATIONS
// ======================================================

function Integrations() {

  return (

    <div className="grid gap-4 md:grid-cols-3">

      <Card
        label="SPOTIFY"
        title="Pending"
        subtitle="Connect later"
      />

      <Card
        label="NOTION"
        title="Pending"
        subtitle="Connect later"
      />

      <Card
        label="PINTEREST"
        title="Pending"
        subtitle="Connect later"
      />

    </div>

  );
}


// ======================================================
// DEVICE
// ======================================================

function Device() {

  return (

    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">

      <h3 className="text-2xl font-medium">
        Cyberdeck Device
      </h3>


      <div className="mt-6 space-y-4">

        <DeviceRow
          label="Controller"
          value="ESP32 DevKit V1"
        />

        <DeviceRow
          label="Display"
          value='3.5" ILI9486'
        />

        <DeviceRow
          label="Resolution"
          value="480 × 320"
        />

        <DeviceRow
          label="Cloud"
          value="Supabase"
        />

      </div>

    </div>

  );
}


// ======================================================
// CARD
// ======================================================

function Card({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {

  return (

    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">

      <p className="text-xs tracking-[0.2em] text-cyan-300/60">
        {label}
      </p>


      <h3 className="mt-4 text-2xl font-medium">
        {title}
      </h3>


      <p className="mt-2 text-sm text-white/40">
        {subtitle}
      </p>

    </div>

  );
}


// ======================================================
// DEVICE ROW
// ======================================================

function DeviceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="flex items-center justify-between border-b border-white/5 pb-4">

      <span className="text-sm text-white/45">
        {label}
      </span>


      <span className="text-sm">
        {value}
      </span>

    </div>

  );
}