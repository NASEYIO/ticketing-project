// FILE: src/pages/EditEvent.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../services/api";

const CLOUDINARY_CLOUD_NAME = "fojwosyf";
const CLOUDINARY_UPLOAD_PRESET = "vibepass_events";

function getUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (err) {
    return null;
  }
}

async function uploadToCloudinary(file, resourceType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload ${resourceType}`);
  }

  const data = await response.json();
  return data.secure_url;
}

function toDatetimeLocalValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditEvent({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  const [tiers, setTiers] = useState([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [existingVideoUrl, setExistingVideoUrl] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");

  const currentUserContext = user?.id ? user : getUserFromToken();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});

    api.getEventDetails(id)
      .then((event) => {
        setTitle(event.title);
        setDescription(event.description);
        setDate(toDatetimeLocalValue(event.date));
        setVenue(event.venue);
        setCategoryId(event.categoryId || "");
        setTiers(event.tiers.map(t => ({ id: t.id, name: t.name, price: t.price, capacity: t.capacity, sold: t.sold })));
        setExistingPhotoUrls(event.photoUrls || []);
        setExistingVideoUrl(event.videoUrl || null);
      })
      .catch((err) => setError(err.message || "Could not load event."))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (!currentUserContext) {
    return <div style={{ padding: "40px", textAlign: "center" }}><h3>Please log in to edit events.</h3></div>;
  }

  if (currentUserContext.role !== "ORGANIZER") {
    return <div style={{ padding: "40px", textAlign: "center" }}><h3>⛔ Access Denied.</h3></div>;
  }

  if (isLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading event...</div>;
  }

  const handleAddTierRow = () => {
    setTiers([...tiers, { name: "", price: "", capacity: "" }]);
  };

  const handleRemoveTierRow = (index) => {
    if (tiers.length === 1) return;
    const tier = tiers[index];
    if (tier.sold > 0) {
      alert(`Cannot remove "${tier.name}" — it already has ${tier.sold} ticket(s) sold.`);
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index, field, value) => {
    const updated = [...tiers];
    updated[index][field] = value;
    setTiers(updated);
  };

  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotoUrls(existingPhotoUrls.filter((_, i) => i !== index));
  };

  const handleNewPhotoSelection = (e) => {
    const files = Array.from(e.target.files || []);
    setNewPhotoFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveNewPhoto = (index) => {
    setNewPhotoFiles(newPhotoFiles.filter((_, i) => i !== index));
  };

  const handleVideoSelection = (e) => {
    setNewVideoFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setUploadStatus("");

    const formattedTiers = tiers.map(t => ({
      id: t.id,
      name: t.name || "General Admission",
      price: parseFloat(t.price) || 0,
      capacity: parseInt(t.capacity) || 0
    }));

    try {
      let uploadedPhotoUrls = [];
      if (newPhotoFiles.length > 0) {
        setUploadStatus(`Uploading ${newPhotoFiles.length} new photo(s)...`);
        uploadedPhotoUrls = await Promise.all(
          newPhotoFiles.map((file) => uploadToCloudinary(file, "image"))
        );
      }

      let videoUrl = existingVideoUrl;
      if (newVideoFile) {
        setUploadStatus("Uploading video...");
        videoUrl = await uploadToCloudinary(newVideoFile, "video");
      }

      setUploadStatus("Saving changes...");

      const finalPhotoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls];

      await api.updateEvent(id, {
        title,
        description,
        date,
        venue,
        categoryId: categoryId || null,
        tiers: formattedTiers,
        photoUrls: finalPhotoUrls,
        videoUrl
      });

      alert(`"${title}" has been updated successfully!`);
      navigate("/organizer/dashboard");

    } catch (err) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
      setUploadStatus("");
    }
  };

  return (
    <div style={{ maxWidth: "650px", margin: "40px auto", padding: "40px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <h2>Edit Event</h2>
      <p style={{ color: "#64748b", marginBottom: "30px" }}>Update your event details, media, and ticket tiers.</p>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", marginBottom: "20px", fontSize: "0.9rem" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Description</label>
          <textarea rows="4" required value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", fontFamily: "inherit" }}></textarea>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Date & Time</label>
            <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Venue Location</label>
            <input type="text" required value={venue} onChange={e => setVenue(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Category</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", background: "white" }}>
            <option value="">-- No Category (Unassigned) --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</option>
            ))}
          </select>
        </div>

        <hr style={{ borderColor: "#e2e8f0", margin: "10px 0" }} />

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
            Current Photos ({existingPhotoUrls.length})
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
            {existingPhotoUrls.map((url, index) => (
              <div key={index} style={{ position: "relative" }}>
                <img src={url} alt={`Photo ${index}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                <button type="button" onClick={() => handleRemoveExistingPhoto(index)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
              </div>
            ))}
            {existingPhotoUrls.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>No photos currently attached.</p>}
          </div>

          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
            Add New Photos
          </label>
          <input type="file" accept="image/*" multiple onChange={handleNewPhotoSelection} style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
          {newPhotoFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
              {newPhotoFiles.map((file, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img src={URL.createObjectURL(file)} alt={`New ${index}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                  <button type="button" onClick={() => handleRemoveNewPhoto(index)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
            Event Video {existingVideoUrl ? "(currently attached)" : "(none attached)"}
          </label>
          <input type="file" accept="video/*" onChange={handleVideoSelection} style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }} />
          {newVideoFile && <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "6px" }}>New video selected: {newVideoFile.name} (will replace current video)</p>}
        </div>

        <hr style={{ borderColor: "#e2e8f0", margin: "10px 0" }} />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Ticket Tier Structures</h3>
            <button type="button" onClick={handleAddTierRow} style={{ background: "#eff6ff", color: "#2563eb", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" }}>
              + Add Tier Class
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tiers.map((tier, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr auto", gap: "10px", alignItems: "center", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <input type="text" required placeholder="Tier Class Name" value={tier.name} onChange={e => handleTierChange(index, "name", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                <input type="number" required min="0" placeholder="Price (KES)" value={tier.price} onChange={e => handleTierChange(index, "price", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                <input type="number" required min={tier.sold || 1} placeholder="Capacity" value={tier.capacity} onChange={e => handleTierChange(index, "capacity", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                <button type="button" onClick={() => handleRemoveTierRow(index)} disabled={tiers.length === 1} style={{ background: "transparent", color: tiers.length === 1 ? "#cbd5e1" : "#ef4444", border: "none", fontSize: "1.2rem", cursor: tiers.length === 1 ? "not-allowed" : "pointer" }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {uploadStatus && <p style={{ color: "#2563eb", fontSize: "0.9rem", fontWeight: "600", textAlign: "center" }}>{uploadStatus}</p>}

        <Button type="submit" isLoading={isSaving} size="lg" fullWidth style={{ marginTop: "15px" }}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}

export default EditEvent;