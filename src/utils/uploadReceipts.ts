// Store only opaque references and SHA-256 digests, never private media or passcodes.
const KEY = 'dearli.uploadReceipts.v1';
type Receipt = { creationId: string; files: Record<string, { digest: string; reference: string }> };
const read = (creationId: string): Receipt => { try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved?.creationId === creationId && saved.files) return saved; } catch {} return { creationId, files: {} }; };
export const mediaDigest = async (data: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))), b => b.toString(16).padStart(2, '0')).join('');
export const findUploadReceipt = (creationId: string, key: string, digest: string): string | undefined => { const saved = read(creationId).files[key]; return saved?.digest === digest && saved.reference.startsWith('storage:' + creationId + '/') ? saved.reference : undefined; };
export const rememberUpload = (creationId: string, key: string, digest: string, reference: string) => { const saved = read(creationId); saved.files[key] = { digest, reference }; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* Retries remain safe through stable server paths. */ } };
export const clearUploadReceipts = () => { try { localStorage.removeItem(KEY); } catch {} };
