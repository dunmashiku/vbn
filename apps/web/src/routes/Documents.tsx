import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MILESTONES, type DocumentId, type DocumentRule, type DocumentStatus } from "@vbn/shared";
import { useEffect, useId, useRef, useState } from "react";
import { useChat } from "../components/Chat";
import { useDocumentTitle } from "../components/Common";
import { IconAlert, IconExternal, IconFile, IconShield, IconSparkle, IconUpload } from "../components/Icons";
import { PRODUCT_NAME } from "../config";
import { deleteFile, putFile, type StoredFile } from "../lib/docStore";
import { ACCEPT_ATTR, checkFile, formatBytes } from "../lib/fileCheck";
import { buildSampleFiles } from "../lib/sampleDocs";
import { loadDocStatuses, saveDocStatuses } from "../lib/storage";
import { FILES_QUERY_KEY, useNavigatorData, type NavigatorData } from "../lib/useNavigator";

const STATUS_TEXT: Record<DocumentStatus, string> = { "not-started": "Not started", requested: "Requested", ready: "Ready" };

function setStatus(id: DocumentId, status: DocumentStatus) {
  saveDocStatuses({ ...loadDocStatuses(), [id]: status });
}

function Preview({ file }: { file: StoredFile }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file.blob]);
  if (!url) return null;
  return file.type === "application/pdf" ? (
    <iframe src={url} title={`Preview of ${file.name}`} className="h-[28rem] w-full rounded-lg border border-line bg-white" />
  ) : (
    <img src={url} alt={`Preview of ${file.name}`} className="max-h-[28rem] w-auto rounded-lg border border-line" />
  );
}

function DocumentItem({ doc, data }: { doc: DocumentRule; data: NavigatorData }) {
  const qc = useQueryClient();
  const { ask, pending } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const statusId = useId();
  const file = data.files[doc.id];
  const status = data.docStatus(doc.id);
  const usedFor = doc.milestones
    .map((id) => data.timeline.find((t) => t.rule.id === id))
    .filter((t) => t !== undefined);

  const attach = useMutation({
    mutationFn: async (f: File) => {
      const check = await checkFile(f);
      if (!check.ok) throw new Error(check.error);
      await putFile({ docId: doc.id, name: f.name, type: check.type, size: f.size, addedAt: new Date().toISOString(), blob: f.slice(0, f.size, check.type) });
    },
    onMutate: () => setError(null),
    onError: (e) => setError((e as Error).message),
    onSuccess: () => {
      setStatus(doc.id, "ready");
      void qc.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteFile(doc.id),
    onSuccess: () => {
      setStatus(doc.id, "not-started");
      setShowPreview(false);
      void qc.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    },
  });

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) attach.mutate(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <li id={`d-${doc.id}`} className="card scroll-mt-28 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="max-w-[40ch] font-sans text-xl font-bold text-navy-900">{doc.name}</h3>
        {doc.handling === "have-ready" ? (
          <span className={`chip ${status === "ready" ? "chip-ready" : "chip-not-started"}`}>{status === "ready" ? "Ready" : "Have ready"}</span>
        ) : (
          <span className={`chip chip-${status}`}><span className="sr-only">Status: </span>{STATUS_TEXT[status]}</span>
        )}
      </div>
      <p className="prose-measure mt-2">{doc.why}</p>
      <dl className="mt-3 grid gap-1 text-base">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-muted">Where to get it:</dt>
          <dd>
            <a href={doc.whereToGet.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
              {doc.whereToGet.label}<span className="sr-only"> (opens in a new tab)</span> <IconExternal size={15} />
            </a>
          </dd>
        </div>
        {usedFor.length > 0 && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Needed for:</dt>
            <dd>
              {usedFor.map((t, i) => (
                <span key={t.rule.id}>
                  {i > 0 && ", "}
                  <Link to="/timeline" hash={`m-${t.rule.id}`} className="link">{t.rule.shortTitle}</Link>
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      {doc.handling === "have-ready" ? (
        <div className="mt-4 rounded-lg border border-line bg-paper p-4">
          <p className="flex gap-2 text-base">
            <IconShield size={20} className="mt-0.5 shrink-0 text-navy-700" />
            <span><strong>Reminder only.</strong> Have this ready when you apply. It's never uploaded, typed or stored here.</span>
          </p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
            <input type="checkbox" className="h-6 w-6 accent-ok" checked={status === "ready"} onChange={(e) => setStatus(doc.id, e.target.checked ? "ready" : "not-started")} />
            I have this ready
          </label>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {!file && (
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor={statusId} className="font-semibold">Status</label>
              <select id={statusId} className="input !min-h-11 w-auto py-1.5 text-base" value={status} onChange={(e) => setStatus(doc.id, e.target.value as DocumentStatus)}>
                <option value="not-started">Not started</option>
                <option value="requested">Requested</option>
                <option value="ready">Ready</option>
              </select>
            </div>
          )}

          {file ? (
            <div className="rounded-lg border border-line bg-paper p-4">
              <div className="flex flex-wrap items-center gap-3">
                <IconFile size={22} className="text-navy-700" />
                <span className="font-semibold break-all">{file.name}</span>
                {file.sample && <span className="chip chip-due-soon">SAMPLE</span>}
                <span className="text-base text-muted">{formatBytes(file.size)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm btn-outline" aria-expanded={showPreview} onClick={() => setShowPreview((s) => !s)}>
                  {showPreview ? "Hide preview" : "Preview"}
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => inputRef.current?.click()}>Replace</button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => remove.mutate()}>Remove</button>
                {file.sample && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={pending}
                    onClick={() =>
                      ask(`Please explain this sample document in plain language: what it is, what the key fields mean, and what I should check for accuracy.`, {
                        sampleDocument: file.sample,
                        display: `Explain this document: ${file.sample!.title}`,
                      })
                    }
                  >
                    <IconSparkle size={18} /> Explain this document
                  </button>
                )}
              </div>
              {showPreview && <div className="mt-4"><Preview file={file} /></div>}
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${dragging ? "border-navy-700 bg-navy-100" : "border-[#8c8577] bg-paper"}`}
            >
              <IconUpload size={26} className="text-navy-700" />
              <p className="text-base">
                Drag a file here, or{" "}
                <button type="button" className="link font-semibold" onClick={() => inputRef.current?.click()}>
                  choose a file<span className="sr-only"> for {doc.name}</span>
                </button>
              </p>
              <p className="text-sm text-muted">PDF, JPG or PNG, up to 10 MB. Stays in this browser.</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFiles(e.target.files)} />
          {attach.isPending && <p role="status" className="text-base text-muted">Checking file…</p>}
          {error && <p role="alert" className="flex gap-2 rounded-lg bg-bad-bg px-3 py-2 text-base text-bad"><IconAlert size={20} className="mt-0.5 shrink-0" />{error}</p>}
          <p className="text-sm text-muted">
            {PRODUCT_NAME} only organizes this. You upload it yourself on VA.gov or give it to your free accredited representative.
          </p>
        </div>
      )}
    </li>
  );
}

export function DocumentsPage() {
  useDocumentTitle(`My documents · ${PRODUCT_NAME}`);
  const data = useNavigatorData();
  const qc = useQueryClient();

  const loadSamples = useMutation({
    mutationFn: async (d: NavigatorData) => {
      const samples = buildSampleFiles(d.intake, d.documents.map((x) => x.id));
      for (const s of samples) await putFile(s);
      const statuses = loadDocStatuses();
      for (const s of samples) statuses[s.docId] = "ready";
      saveDocStatuses(statuses);
      return samples.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FILES_QUERY_KEY }),
  });

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, [data !== null]);

  if (!data) return null;
  const total = data.documents.length;
  const pct = Math.round((data.readyCount / Math.max(1, total)) * 100);

  // Group each document under its primary milestone: the first one listed in documents.ts that's on this timeline.
  const onTimeline = new Set(data.timeline.map((t) => t.rule.id));
  const groups = data.timeline
    .map((t) => ({
      item: t,
      docs: data.documents.filter((d) => d.milestones.find((id) => onTimeline.has(id)) === t.rule.id),
    }))
    .filter((g) => g.docs.length > 0);
  const hasSamples = Object.values(data.files).some((f) => f?.sample);

  return (
    <div>
      <p className="eyebrow">My documents</p>
      <h1 className="mt-2 text-4xl text-navy-900 sm:text-5xl">Documents you'll need</h1>
      <p className="prose-measure mt-3 text-lg text-muted">
        Based on your answers. Gather these ahead of time so each step goes faster.
      </p>

      <div role="note" className="mt-6 flex gap-3 rounded-xl border-2 border-gold bg-warn-bg p-4 text-warn">
        <IconAlert size={24} className="mt-0.5 shrink-0" />
        <p className="font-semibold">Demo only: use the sample documents. Don't upload real personal records.</p>
      </div>

      <section aria-label="Document progress" className="card mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[14rem] flex-1">
            <p id="docs-progress" className="font-semibold">{data.readyCount} of {total} documents ready</p>
            <div role="progressbar" aria-labelledby="docs-progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={data.readyCount} className="mt-2 h-2.5 rounded-full bg-paper-2">
              <div className="h-2.5 rounded-full bg-ok transition-[width]" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-primary" disabled={loadSamples.isPending} onClick={() => loadSamples.mutate(data)}>
            {hasSamples ? "Reload sample documents" : "Load sample documents"}
          </button>
        </div>
        {loadSamples.isSuccess && (
          <p role="status" className="mt-3 text-base text-ok">
            Added {loadSamples.data} fake documents, each marked SAMPLE.
          </p>
        )}
      </section>

      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <section key={g.item.rule.id} aria-labelledby={`g-${g.item.rule.id}`}>
            <h2 id={`g-${g.item.rule.id}`} className="text-2xl text-navy-900">
              {MILESTONES.find((m) => m.id === g.item.rule.id)?.shortTitle}
            </h2>
            <ul className="mt-4 space-y-4">
              {g.docs.map((d) => <DocumentItem key={d.id} doc={d} data={data} />)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
