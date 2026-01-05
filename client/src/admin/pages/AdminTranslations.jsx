// client/src/admin/pages/AdminTranslations.jsx
import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import Modal from "../components/Modal.jsx";
import FormRow from "../components/FormRow.jsx";
import { adminApi } from "../api/adminApi.js";
import { endpoints } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";

export default function AdminTranslations() {
  const toast = useToast();
  const [lang, setLang] = useState("ua");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const load = async (l) => {
    try {
      setLoading(true);
      const r = await adminApi.get(endpoints.translationsByLang(l));
      setData(r.data);
    } catch (e) {
      toast.error(e.friendlyMessage || "Failed to load translations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(lang);
    // eslint-disable-next-line
  }, [lang]);

  return (
    <>
      <PageHeader
        title="Translations"
        subtitle="Currently: GET /api/translations/:lang. Saving depends on your backend model."
        actions={
          <>
            <select className="select" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="ua">ua</option>
              <option value="en">en</option>
            </select>
            <button
              className="btn primary"
              onClick={() => {
                setJsonText(JSON.stringify(data ?? {}, null, 2));
                setOpen(true);
              }}
              disabled={!data}
            >
              View JSON
            </button>
          </>
        }
      />

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div style={{ opacity: 0.7 }}>Loading…</div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.92 }}>
              {JSON.stringify(data ?? {}, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <Modal
        open={open}
        title={`Translations JSON (${lang})`}
        onClose={() => setOpen(false)}
        footer={
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setOpen(false)}>Close</button>
            <button
              className="btn"
              onClick={() => {
                navigator.clipboard.writeText(jsonText || "");
                toast.success("Copied");
              }}
            >
              Copy
            </button>
          </div>
        }
      >
        <FormRow label="JSON">
          <textarea className="textarea" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
        </FormRow>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Save не включен, потому что у тебя модель переводов может быть:
          (1) один документ на язык (strict:false), или (2) flat key/value.
          Если скинешь `translationsController.js`, я добавлю кнопку Save 1:1 под твой формат.
        </div>
      </Modal>
    </>
  );
}
