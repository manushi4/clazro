		Here is the **next core brick**, written in full production depth and ready for your `docs/` folder.

---

# 📄 `docs/MEDIA_FILE_HANDLING_SPEC.md`

### Storage, Caching, Downloading & Offline Rules for PDF/Video/Image Media in Mansuhi

```md
# 🎥 MEDIA_FILE_HANDLING_SPEC.md
### Media Storage, Download, Offline Access & Security Handling for Mansuhi

This specification defines how the Mansuhi platform handles **all types of media files**, including:

- Study PDFs  
- Videos (class recordings)  
- Thumbnails  
- Images (profile, content)  
- User-uploaded files (assignments, doubt images)  
- Downloaded files for offline use  

This system must be consistent, secure, offline-aware, and multi-tenant safe.

---

# 1. 🎯 Objectives

1. Ensure media loads fast and reliably across varied network conditions.
2. Support **offline reading** of PDFs and downloaded content.
3. Keep file storage **organized per customer**.
4. Ensure secure upload & download mechanisms.
5. Avoid duplicate storage or unnecessary downloads.
6. Handle corruption, missing files, and expired URLs gracefully.
7. Provide a clear API for widgets/screens to use media.

---

# 2. 📦 Storage Architecture

Three storage layers are involved:

```

Supabase Storage  (source of truth)
↓
React Query     (metadata cache)
↓
AsyncStorage      (download registry)
↓
Local FileSystem  (actual file bytes)

```

### 2.1 Supabase Storage Buckets

We define dedicated buckets:

| Bucket Name | Purpose |
|-------------|----------|
| `study-pdfs` | Study resources in PDF format |
| `class-recordings` | Video lectures, recorded classes |
| `thumbnails` | Cover images, chapter thumbnails |
| `user-uploads` | Doubt images, assignment attachments |
| `avatars` | Profile images |
| `school-branding` | Customer logos, banners |

All paths **must begin with customer slug**:

```

study-pdfs/<customerSlug>/<resourceId>.pdf
class-recordings/<customerSlug>/<classId>.mp4
avatars/<customerSlug>/<userId>.jpeg

```

This prevents cross-tenant leaks.

---

# 3. 🧱 File Naming Strategy

### 3.1 PDFs

```

study-pdfs/<customerSlug>/<resourceId>.pdf

```

### 3.2 Videos

```

class-recordings/<customerSlug>/<classId>.mp4

```

### 3.3 User Uploads

```

user-uploads/<customerSlug>/<doubtId>/<filename>

```

### 3.4 Branding Assets

```

school-branding/<customerSlug>/logo.png

```

**Never** store files with user-provided names directly. Normalize them:

- Lowercase
- Replace spaces
- Append unique short ID when needed.

---

# 4. 🔐 URL Access & Security Rules

Supabase Storage supports:

- **Signed URLs** (temp access tokens)
- **RLS policies** (row-level security)
- **Public buckets** (NOT recommended for most features)

### Rules:

1. PDFs and videos should always use **signed URLs**.
2. Signed URLs should expire within:
   - 2 minutes for videos
   - 10 minutes for PDFs
3. Never store signed URLs in AsyncStorage (they expire).
4. Never pass private storage URLs directly to clients.
5. On 403 errors:
   - Refresh signed URL
   - Retry once

### Upload Security

All uploads must:
- Use `service-role` for admin tools  
- Use RLS-controlled policies for client uploads  
- Check extension + mime type  
- Check file size limit (configurable per customer)

---

# 5. 📥 Download Manager (Offline Files)

A dedicated module handles:

```

src/media/downloadManager/

````

### Responsibilities:
- Download PDFs/videos/images to device  
- Store metadata in AsyncStorage  
- Check if file already exists  
- Validate file size & integrity  
- Remove old files  
- Serve local file instead of network version  
- Handle offline behaviour gracefully  

### Metadata stored in AsyncStorage:

```ts
{
  fileId: string;
  resourceId: string;
  localPath: string;
  size: number;
  downloadedAt: timestamp;
  type: "pdf" | "video" | "image";
}
````

### Download Flow:

1. User taps “Download”.
2. DownloadManager checks:

   * File exists?
   * Correct size?
   * Not corrupted?
3. If valid:

   * Mark as downloaded
4. If not:

   * Fetch via HTTPS signed URL
   * Write to `FileSystem.documentDirectory + /mansuhi/<id>`
   * Save metadata

---

# 6. ⚡ File Access Rules

### When online:

* Prefer local file (if exists)
* Otherwise, fetch online version

### When offline:

* If file exists → open local version
* If not → show:

  ```
  "Connect to internet to download this file"
  ```

### If file corrupted:

* Delete file
* Force re-download
* Log “media_corrupted” analytics event

---

# 7. 📥 Download Storage Paths

Use:

```
FileSystem.documentDirectory + "mansuhi_downloads/"
```

Structure:

```
mansuhi_downloads/
  pdfs/
    <resourceId>.pdf
  videos/
    <classId>.mp4
  images/
    <id>.jpg
```

---

# 8. 🔁 Background Sync for Media

Background sync attempts:

* Fix missing metadata
* Delete orphaned files
* Refresh file availability
* Remove corrupted files

Triggers when:

* App enters foreground
* Network reconnects
* User opens download manager

---

# 9. 🧪 Offline Mode Requirements

Widgets/screens accessing media must:

* Check `useNetworkStatus()`
* If offline and file not downloaded:

  * Block action
  * Show offline message
* Allow opening local file immediately
* Avoid re-fetching metadata while offline

---

# 10. 🧩 UI Guidelines

### Download button states:

| State                    | UI                               |
| ------------------------ | -------------------------------- |
| Not downloaded           | “Download for offline use”       |
| Downloading              | Loader + % progress              |
| Downloaded               | “Available offline” (with icon)  |
| Download failed          | “Retry download”                 |
| Offline & not downloaded | Disabled + “Connect to download” |

### Errors:

* “File corrupted — re-downloading”
* “Download failed — check internet”
* “Not enough storage” (optional)

---

# 11. 🛑 Avoiding Issues

### Rule 1

Never store signed URLs in cache.

### Rule 2

Always validate file integrity via:

* file size
* file existence
* optional hash (future)

### Rule 3

Always include customerSlug in paths.

### Rule 4

Avoid re-downloading unnecessarily.

### Rule 5

Never assume network availability.

---

# 12. 🧪 Testing

### Unit Tests

* File exists → open local
* File missing → fetch online
* Corrupted file → delete + retry

### Integration Tests

* Offline open PDF works
* Offline open non-downloaded PDF fails gracefully
* Signed URL refresh works

### E2E Tests

* Full download → airplane mode → open → succeeds
* Delete file → app detects and re-downloads
* Customer A cannot access Customer B file

---

# 13. 🏁 Summary

This spec ensures that media handling in Mansuhi is:

* Secure
* Multi-tenant safe
* Offline-capable
* Efficient
* Consistent
* Extensible
* Error-resilient

Following this spec, large schools can confidently rely on:

* offline PDFs
* smooth video playback
* safe student uploads
* fast loading thumbnails
* no cross-tenant leakage

```
End of MEDIA_FILE_HANDLING_SPEC.md
```

---

