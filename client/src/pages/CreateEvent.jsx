// FILE: src/pages/CreateEvent.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    console.error("Failed to decode stored token:", err);
    return null;
  }
}

// Uploads a single file directly to Cloudinary from the browser.
// resourceType is "image" or "video" — Cloudinary uses separate endpoints for each.
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

function CreateEvent({ user }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesUnavailable, setCategoriesUnavailable] = useState(false);

  const [tiers, setTiers] = useState([{ name: "General Admission", price: "", capacity: "" }]);

  const [photoFiles, setPhotoFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  const currentUserContext = user?.id ? user : getUserFromToken();

  useEffect(() => {
    api.getCategories()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategoriesUnavailable(true);
        }
      })
      .catch((err) => {
        console.error("Error pulling category objects:", err);
        setCategoriesUnavailable(true);
      });
  }, []);

  if (!currentUserContext) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>⌛ Connecting Secure Session Context...</h3>
        <p style={{ color: "#64748b" }}>Please make sure you are logged in to your account on this domain.</p>
      </div>
    );
  }

  if (currentUserContext.role !== "ORGANIZER") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>⛔ Access Denied. Organizer clearance required to publish events.</h3>
      </div>
    );
  }

  const handleAddTierRow = () => {
    setTiers([...tiers, { name: "", price: "", capacity: "" }]);
  };

  const handleRemoveTierRow = (index) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...tiers];
    updatedTiers[index][field] = value;
    setTiers(updatedTiers);
  };

  const handlePhotoSelection = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles((prev) => [...prev, ...files]);
  };

  const handleRemovePhoto = (index) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
  };

  const handleVideoSelection = (e) => {
    const file = e.target.files?.[0] || null;
    setVideoFile(file);
  };

  const handleEventSubmission = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setError("");
    setUploadStatus("");

    const formattedTiers = tiers.map(t => ({
      name: t.name || "General Admission",
      price: parseFloat(t.price) || 0,
      capacity: parseInt(t.capacity) || 0
    }));

    try {
      let photoUrls = [];
      let videoUrl = null;

      if (photoFiles.length > 0) {
        setUploadStatus(`Uploading ${photoFiles.length} photo(s)...`);
        photoUrls = await Promise.all(
          photoFiles.map((file) => uploadToCloudinary(file, "image"))
        );
      }

      if (videoFile) {
        setUploadStatus("Uploading video...");
        videoUrl = await uploadToCloudinary(videoFile, "video");
      }

      setUploadStatus("Publishing event...");

      await api.createEvent({
        title,
        description,
        date,
        venue,
        categoryId: categoryId || null,
        tiers: formattedTiers,
        photoUrls,
        videoUrl
      });

      alert(`🎉 "${title}" has been successfully broadcast live to VibePass listings!`);
      navigate("/organizer/dashboard");

    } catch (err) {
      setError(err.message || "Network pipeline exception occurred during transmission.");
    } finally {
      setIsPublishing(false);
      setUploadStatus("");
    }
  };

  return (
    <div style={{ maxWidth: "650px", margin: "40px auto", padding: "40px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <h2>📅 Publish New Live Event</h2>
      <p style={{ color: "#64748b", marginBottom: "30px" }}>Fill in the parameters below to spin up real event seats and ticket allocation configurations inside PostgreSQL.</p>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", marginBottom: "20px", fontSize: "0.9rem" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleEventSubmission} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Title</label>
          <input type="text" required placeholder="e.g., Amapiano Sunset Fest or Tech Meetup" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Description</label>
          <textarea rows="4" required placeholder="Describe what attendees should look forward to..." value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", fontFamily: "inherit" }}></textarea>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Date & Time</label>
            <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Venue Location</label>
            <input type="text" required placeholder="e.g., Alchemist Bar, Westlands" value={venue} onChange={e => setVenue(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Category</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", background: "white" }}
          >
            <option value="">-- No Category (Unassigned) --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
              </option>
            ))}
          </select>
          {categoriesUnavailable && (
            <p style={{ color: "#b91c1c", fontSize: "0.8rem", marginTop: "6px" }}>
              ⚠️ Categories couldn't be loaded. You can still publish without one selected.
            </p>
          )}
        </div>

        <hr style={{ borderColor: "#e2e8f0", margin: "10px 0" }} />

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
            📷 Event Photos ({photoFiles.length})
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelection}
            style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
          />
          {photoFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
              {photoFiles.map((file, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index}`}
                    style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    style={{
                      position: "absolute", top: "-6px", right: "-6px",
                      background: "#ef4444", color: "white", border: "none",
                      borderRadius: "50%", width: "20px", height: "20px",
                      cursor: "pointer", fontSize: "0.7rem", lineHeight: "1"
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>
            🎬 Event Video (optional)
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoSelection}
            style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
          />
          {videoFile && (
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "6px" }}>
              Selected: {videoFile.name}
            </p>
          )}
        </div>

        <hr style={{ borderColor: "#e2e8f0", margin: "10px 0" }} />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>🎟️ Ticket Tier Structures</h3>
            <button type="button" onClick={handleAddTierRow} style={{ background: "#eff6ff", color: "#2563eb", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" }}>
              + Add Tier Class
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tiers.map((tier, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr auto", gap: "10px", alignItems: "center", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <input type="text" required placeholder="Tier Class Name (e.g., VIP)" value={tier.name} onChange={e => handleTierChange(index, "name", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                <input type="number" required min="0" placeholder="Price (KES)" value={tier.price} onChange={e => handleTierChange(index, "price", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                <input type="number" required min="1" placeholder="Capacity" value={tier.capacity} onChange={e => handleTierChange(index, "capacity", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />

                <button type="button" onClick={() => handleRemoveTierRow(index)} disabled={tiers.length === 1} style={{ background: "transparent", color: tiers.length === 1 ? "#cbd5e1" : "#ef4444", border: "none", fontSize: "1.2rem", cursor: tiers.length === 1 ? "not-allowed" : "pointer", padding: "0 5px" }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {uploadStatus && (
          <p style={{ color: "#2563eb", fontSize: "0.9rem", fontWeight: "600", textAlign: "center" }}>
            {uploadStatus}
          </p>
        )}

        <Button type="submit" isLoading={isPublishing} size="lg" fullWidth style={{ marginTop: "15px" }}>
          Broadcast Event to Live Marketplace
        </Button>
      </form>
    </div>
  );
}

export default CreateEvent;