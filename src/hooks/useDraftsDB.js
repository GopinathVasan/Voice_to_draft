import Dexie from "dexie";

const db = new Dexie("tamilVoiceDraftDB");
db.version(1).stores({
  drafts: "++id, title, updatedAt" // Delta/HTML stored in object
});

export async function saveDraft({ id, title, delta, html }) {
  const now = Date.now();
  if (id) {
    await db.drafts.update(id, { title, delta, html, updatedAt: now });
    return id;
  }
  return await db.drafts.add({ title, delta, html, updatedAt: now });
}

export async function loadDraft(id) {
  return await db.drafts.get(id);
}

export async function listDrafts() {
  return await db.drafts.orderBy("updatedAt").reverse().toArray();
}

export async function deleteDraft(id) {
  await db.drafts.delete(id);
}

export default db;
