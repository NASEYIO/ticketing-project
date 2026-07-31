// FILE: src/pages/GateScanner.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../services/api";

const STORAGE_KEY_PREFIX = "vibepass_offline_codes_";
const PENDING_SCANS_KEY_PREFIX = "vibepass_pending_scans_";

function GateScanner({ user }) {
  const { eventId } = useParams();
  const codesStorageKey = STORAGE_KEY_PREFIX + eventId;
  const pendingStorageKey = PENDING_SCANS_KEY_PREFIX + eventId;

  const [eventTitle, setEventTitle] = useState("");
  const [codes, setCodes] = useState({}); // { secretCode: status }
  const [pendingScans, setPendingScans] = useState([]);
  const [codeInput, setCodeInput] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState("");

  // Load anything already cached locally from a previous session
  useEffect(() => {
    const storedCodes = localStorage.getItem(codesStorageKey);
    const storedPending = localStorage.getItem(pendingStorageKey);
    if (storedCodes) setCodes(JSON.parse(storedCodes));
    if (storedPending) setPendingScans(JSON.parse(storedPending));
  }, [codesStorageKey, pendingStorageKey]);

  // Track online/offline status live
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleDownloadCodes = async () => {
    setIsDownloading(true);
    setError("");
    try {
      const data = await api.getEventCodesForOfflineScanning(eventId);
      setEventTitle(data.eventTitle);

      const codesMap = {};
      data.tickets.forEach((t) => {
        codesMap[t.secretCode] = t.status;
      });
      setCodes(codesMap);
      localStorage.setItem(codesStorageKey, JSON.stringify(codesMap));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleScan = (e) => {
    e.preventDefault();
    const code = codeInput.trim();
    setCodeInput("");

    if (!code) return;

    const currentStatus = codes[code];

    if (currentStatus === undefined) {
      setLastResult({ code, outcome: "NOT_FOUND" });
      return;
    }

    if (currentStatus === "USED") {
      setLastResult({ code, outcome: "ALREADY_USED" });
      return;
    }

    // Mark as used locally right away — this works even with zero internet
    const updatedCodes = { ...codes, [code]: "USED" };
    setCodes(updatedCodes);
    localStorage.setItem(codesStorageKey, JSON.stringify(updatedCodes));

    const updatedPending = [...pendingScans, { secretCode: code, scannedAt: new Date().toISOString() }];
    setPendingScans(updatedPending);
    localStorage.setItem(pendingStorageKey, JSON.stringify(updatedPending));

    setLastResult({ code, outcome: "GRANTED" });

    // Try syncing immediately if we happen to be online, but don't block on it
    if (navigator.onLine) {
      syncPendingScans(updatedPending);
    }
  };

  const syncPendingScans = async (scansToSync = pendingScans) => {
    if (scansToSync.length === 0) return;

    setIsSyncing(true);
    try {
      const result = await api.syncOfflineScans(scansToSync);

      // Remove successfully synced scans from the pending queue.
      // Anything that comes back as a conflict (ALREADY_USED elsewhere)
      // still gets cleared from pending — it's been accounted for,
      // just flagged for awareness, not silently retried forever.
      const stillPending = scansToSync.filter((scan) => {
        const matchingResult = result.results.find((r) => r.secretCode === scan.secretCode);
        return !matchingResult; // keep only ones that somehow got no result
      });

      setPendingScans(stillPending);
      localStorage.setItem(pendingStorageKey, JSON.stringify(stillPending));

      const conflicts = result.results.filter((r) => r.outcome === "ALREADY_USED");
      if (conflicts.length > 0) {
        setError(`⚠️ ${conflicts.length} scan(s) were already used elsewhere before syncing — worth reviewing at the door.`);
      }
    } catch (err) {
      setError("Could not sync scans — will retry when connection improves.");
    } finally {
      setIsSyncing(false);
    }
  };

  const codesCount = Object.keys(codes).length;

  return (
    <div style={{ maxWidth: "500px", margin: "30px auto", padding: "0 20px" }}>
      <div style={{ background: "white", padding: "30px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>🚪 Gate Scanner</h2>
          <span style={{
            padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700",
            background: isOnline ? "#ecfdf5" : "#fef2f2",
            color: isOnline ? "#065f46" : "#b91c1c",
          }}>
            {isOnline ? "● ONLINE" : "○ OFFLINE"}
          </span>
        </div>

        {eventTitle && <p style={{ color: "#64748b", marginTop: 0 }}>{eventTitle}</p>}

        {error && (
          <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {codesCount === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "#64748b" }}>No codes downloaded yet for offline scanning.</p>
            <Button onClick={handleDownloadCodes} isLoading={isDownloading} fullWidth>
              📥 Download Codes for This Event
            </Button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              {codesCount} code(s) cached · {pendingScans.length} scan(s) waiting to sync
            </p>

            <form onSubmit={handleScan} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                type="text"
                autoFocus
                placeholder="Enter or scan ticket code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
              />
              <Button type="submit">Check</Button>
            </form>

            {lastResult && (
              <div style={{
                padding: "20px", borderRadius: "12px", textAlign: "center", marginBottom: "16px",
                background: lastResult.outcome === "GRANTED" ? "#ecfdf5" : "#fef2f2",
                color: lastResult.outcome === "GRANTED" ? "#065f46" : "#b91c1c",
              }}>
                <div style={{ fontSize: "2rem" }}>
                  {lastResult.outcome === "GRANTED" ? "✅" : "❌"}
                </div>
                <p style={{ fontWeight: "700", margin: "8px 0 0 0" }}>
                  {lastResult.outcome === "GRANTED" && "Entry Granted"}
                  {lastResult.outcome === "ALREADY_USED" && "Already Used"}
                  {lastResult.outcome === "NOT_FOUND" && "Code Not Recognized"}
                </p>
                <p style={{ fontSize: "0.8rem", fontFamily: "monospace", opacity: 0.7 }}>{lastResult.code}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => syncPendingScans()}
                isLoading={isSyncing}
                disabled={!isOnline || pendingScans.length === 0}
                fullWidth
              >
                🔄 Sync Now ({pendingScans.length})
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDownloadCodes} isLoading={isDownloading}>
                📥 Refresh
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GateScanner;