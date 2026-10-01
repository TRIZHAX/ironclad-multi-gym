"use client";
import { useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";

type FieldName = "name" | "slug" | "address" | "city" | "province" | "country" | "phone" | "email" | "ownerFullName" | "ownerUsername" | "ownerEmail" | "ownerPhone" | "ownerPassword";
const fields: { name: FieldName; label: string; hint?: string; required?: boolean; type?: string }[] = [
  { name: "name", label: "Gym name", required: true, hint: "Enter the public name of the gym." },
  { name: "slug", label: "URL slug", required: true, hint: "Lowercase letters and numbers separated by hyphens; spaces are converted automatically." },
  { name: "address", label: "Address", required: true },
  { name: "city", label: "City", required: true },
  { name: "province", label: "Province / state" },
  { name: "country", label: "Country", required: true },
  { name: "phone", label: "Gym phone", required: true, type: "tel" },
  { name: "email", label: "Gym email", required: true, type: "email" },
  { name: "ownerFullName", label: "Owner full name", required: true },
  { name: "ownerUsername", label: "Owner username", required: true, hint: "Use lowercase letters, numbers, dots, underscores, or hyphens. Do not use @." },
  { name: "ownerEmail", label: "Owner email", required: true, type: "email" },
  { name: "ownerPhone", label: "Owner phone", type: "tel" },
  { name: "ownerPassword", label: "Owner password (12+ characters)", required: true, type: "password", hint: "Use at least 12 characters." },
];

function slugify(value: string) {
  return value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function validate(values: Record<string, string>) {
  const errors: Partial<Record<FieldName, string>> = {};
  if (!values.name?.trim() || values.name.trim().length < 2) errors.name = "Enter a gym name with at least 2 characters.";
  if (!values.slug?.trim()) errors.slug = "Enter a URL slug.";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim().toLowerCase().replace(/\s+/g, "-"))) errors.slug = "Use lowercase letters and numbers separated by hyphens, for example stay-fit-gym.";
  if (!values.address || values.address.trim().length < 5) errors.address = "Enter an address with at least 5 characters.";
  if (!values.city || values.city.trim().length < 2) errors.city = "Enter a city with at least 2 characters.";
  if (!values.country || values.country.trim().length < 2) errors.country = "Enter a country.";
  if (!values.phone || values.phone.trim().length < 7) errors.phone = "Enter a gym phone number with at least 7 characters.";
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid gym email address.";
  if (!values.ownerFullName || values.ownerFullName.trim().length < 2) errors.ownerFullName = "Enter the owner's full name.";
  if (!values.ownerUsername || !/^[a-z0-9._-]+$/.test(values.ownerUsername.trim().toLowerCase())) errors.ownerUsername = "Use lowercase letters, numbers, dots, underscores, or hyphens only. The @ symbol is not allowed.";
  if (!values.ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.ownerEmail)) errors.ownerEmail = "Enter a valid owner email address.";
  if (values.ownerPassword?.length < 12) errors.ownerPassword = "The owner password must contain at least 12 characters.";
  return errors;
}

export function PlatformCreateGym() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const body = { ...raw, slug: slugify(raw.slug || raw.name || ""), ownerUsername: (raw.ownerUsername || "").trim().toLowerCase() };
    const errors = validate(body);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError("Please correct the highlighted fields before creating the gym.");
      const firstInvalid = Object.keys(errors)[0];
      form.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/platform/gyms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        location.reload();
        return;
      }
      if (data?.issues?.fieldErrors) {
        const serverErrors: Partial<Record<FieldName, string>> = {};
        for (const [key, messages] of Object.entries(data.issues.fieldErrors as Record<string, string[] | undefined>)) {
          if (messages?.length && fields.some((field) => field.name === key)) serverErrors[key as FieldName] = messages[0];
        }
        setFieldErrors(serverErrors);
        setError(Object.keys(serverErrors).length ? "Some fields need attention. Review the red messages below." : (data.error || "Unable to create the gym. Please try again."));
      } else {
        setError(data?.error || "Unable to create the gym. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function clearFieldError(name: FieldName) {
    setFieldErrors((current) => { const next = { ...current }; delete next[name]; return next; });
    setError("");
  }

  return <>
    <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Create gym</button>
    {open && <div className="fixed inset-0 z-50 bg-black/70 p-3 sm:p-6" onMouseDown={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-gym-title" className="ml-auto h-full max-w-xl overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 text-[var(--ink)] shadow-2xl sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <div><p className="eyebrow text-[var(--muted)]">Platform workspace</p><h2 id="create-gym-title" className="display mt-1 text-3xl">CREATE GYM</h2></div>
          <button type="button" aria-label="Close create gym form" className="rounded-lg p-2 hover:bg-[var(--panel-soft)]" onClick={() => setOpen(false)}><X /></button>
        </div>
        {error && <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-red-500/70 bg-red-500/10 p-3 text-sm font-semibold text-red-700 dark:text-red-300"><AlertCircle className="mt-0.5 shrink-0" size={18} /><span>{error}</span></div>}
        <form className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2" onSubmit={submit} noValidate>
          {fields.map(({ name, label, hint, required, type }) => <label key={name} className={name === "address" ? "sm:col-span-2" : ""}>
            <span className="label">{label}{required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null}</span>
            <input
              className={`field ${fieldErrors[name] ? "!border-red-600 !text-red-950 focus:!border-red-600 focus:!ring-2 focus:!ring-red-500/30 dark:!border-red-400 dark:!text-white" : ""}`}
              name={name}
              type={type || "text"}
              required={required}
              minLength={name === "ownerPassword" ? 12 : undefined}
              autoComplete={name === "ownerPassword" ? "new-password" : name.toLowerCase().includes("email") ? "email" : name.toLowerCase().includes("phone") ? "tel" : "off"}
              aria-invalid={Boolean(fieldErrors[name])}
              aria-describedby={fieldErrors[name] ? `${name}-error` : hint ? `${name}-hint` : undefined}
              onChange={() => clearFieldError(name)}
            />
            {fieldErrors[name] ? <span id={`${name}-error`} className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-300">{fieldErrors[name]}</span> : hint ? <span id={`${name}-hint`} className="mt-1 block text-xs text-[var(--muted)]">{hint}</span> : null}
          </label>)}
          <button disabled={busy} className="btn btn-primary sm:col-span-2 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Creating gym…" : "Create and activate"}</button>
        </form>
      </section>
    </div>}
  </>;
}
