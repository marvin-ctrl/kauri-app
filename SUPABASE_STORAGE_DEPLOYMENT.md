# Supabase Storage & RLS Deployment Guide

This document outlines the Supabase Storage implementation and Row Level Security (RLS) policies added to maximize Supabase usage in the Kauri Futsal Club Admin app.

## Overview

This implementation adds:
1. **Supabase Storage** for player photos with file upload functionality
2. **Row Level Security (RLS)** policies across all database tables
3. **Optimized photo handling** with compression and signed URLs
4. **Enhanced UI** with drag-and-drop photo upload component

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/001_setup_storage_and_rls.sql`

This migration includes:
- Storage bucket creation for player photos (`player-photos`)
- New database columns: `photo_storage_path`, `photo_updated_at`
- RLS policies for all tables (players, teams, events, attendance, guardians, etc.)
- Storage RLS policies for secure file access
- Helper function for photo cleanup on updates
- Database triggers for automatic timestamp updates

### 2. Storage Utilities

**File:** `lib/storage.ts`

Provides comprehensive storage management:
- `uploadPlayerPhoto()` - Upload photos to Supabase Storage
- `deletePlayerPhoto()` - Remove photos from storage
- `getPlayerPhotoSignedUrl()` - Generate secure, time-limited URLs
- `compressImage()` - Client-side image optimization (max 1200px, 85% quality)
- `validateImageFile()` - File type and size validation (max 5MB)
- `uploadAndSavePlayerPhoto()` - Complete workflow with rollback support

**Features:**
- Automatic image compression before upload
- File validation (JPEG, PNG, WebP only)
- 5MB file size limit
- Signed URLs with 1-hour expiry
- Rollback on database update failure
- Automatic cleanup of old photos

### 3. PhotoUpload Component

**File:** `app/components/PhotoUpload.tsx`

Reusable photo upload UI with:
- Live image preview
- File picker with drag-and-drop support
- Upload progress indicator
- Error display
- Remove photo functionality
- Responsive design

### 4. Updated Player Edit Page

**File:** `app/players/[id]/edit/page.tsx`

Changes:
- Replaced manual URL input with PhotoUpload component
- Added photo upload on form save
- Integrated with storage utilities
- Support for both new storage and legacy URL fields
- Error handling for upload failures

### 5. Updated Player Profile Page

**File:** `app/players/[id]/page.tsx`

Changes:
- Now displays player photos (previously excluded from query)
- Loads photos from Supabase Storage with signed URLs
- Fallback to legacy `photo_url` field if no storage path
- Responsive layout with photo alongside player details

## Deployment Steps

### Step 1: Apply Database Migration

You have two options:

**Option A: Using Supabase CLI (Recommended)**
```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Apply migration
npx supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_setup_storage_and_rls.sql`
4. Paste and execute the SQL

### Step 2: Verify Storage Bucket

Check that the `player-photos` bucket was created:

1. Go to Supabase Dashboard → Storage
2. Confirm `player-photos` bucket exists
3. Verify settings:
   - Public: `false` (uses signed URLs)
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp`

### Step 3: Verify RLS Policies

Check RLS is enabled:

1. Go to Supabase Dashboard → Database → Tables
2. For each table, verify RLS is enabled (green shield icon)
3. Click on a table → Policies tab to view policies

### Step 4: Deploy Application Code

```bash
# Install dependencies (if needed)
npm install

# Build and test locally
npm run build
npm run dev

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

### Step 5: Test Photo Upload

1. Navigate to a player edit page
2. Click "Upload Photo" and select an image
3. Verify image preview appears
4. Click "Save"
5. Confirm photo appears on player profile page

## Security Features

### Storage Security

- **Private Bucket:** Photos stored in private bucket, not publicly accessible
- **Signed URLs:** Time-limited URLs (1-hour expiry) for secure access
- **File Validation:** Client and server-side validation for file types and sizes
- **RLS Policies:** Row-level access control on storage objects

### Database Security

All tables now have RLS enabled with policies for:
- **SELECT:** Authenticated users can view all records
- **INSERT:** Authenticated users can create records
- **UPDATE:** Authenticated users can modify records
- **DELETE:** Authenticated users can remove records

**Note:** Current policies allow all authenticated users full access. You may want to refine these based on user roles (admin, coach, parent) in the future.

## Features & Benefits

### Immediate Benefits

1. **Better UX:** Drag-and-drop photo upload vs manual URL entry
2. **Photo Display:** Photos now visible on player profiles
3. **Security:** RLS protects all data, signed URLs for photos
4. **Performance:** Automatic image compression reduces file sizes
5. **Reliability:** Centralized storage vs external URL dependencies

### Technical Improvements

- Centralized file management through Supabase
- Automatic image optimization (compression, resizing)
- CDN-backed delivery for fast load times
- Rollback support on upload failures
- Backward compatibility with legacy `photo_url` field

## Architecture

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │
         │ Upload Photo
         ▼
┌─────────────────┐
│ PhotoUpload     │◄──── Client-side compression
│ Component       │      (max 1200px, 85% quality)
└────────┬────────┘
         │
         │ File validation
         ▼
┌─────────────────┐
│ Storage Utils   │◄──── File type/size check
│ (lib/storage)   │      (5MB max, JPEG/PNG/WebP)
└────────┬────────┘
         │
         │ Upload
         ▼
┌─────────────────┐
│ Supabase        │◄──── RLS policies check auth
│ Storage Bucket  │
└────────┬────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│ Database Update │◄──── Save storage path
│ (players table) │      Update timestamp
└─────────────────┘
```

## File Structure

```
kauri-app/
├── lib/
│   ├── storage.ts              # Storage utilities
│   └── supabase.ts             # Supabase client (existing)
├── app/
│   ├── components/
│   │   └── PhotoUpload.tsx     # Photo upload UI component
│   └── players/
│       └── [id]/
│           ├── edit/
│           │   └── page.tsx    # Updated with photo upload
│           └── page.tsx        # Updated to display photos
└── supabase/
    └── migrations/
        └── 001_setup_storage_and_rls.sql  # Migration file
```

## Environment Variables

Ensure these are set in your environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Photos not uploading

1. Check browser console for errors
2. Verify file size < 5MB and correct format (JPEG/PNG/WebP)
3. Confirm user is authenticated
4. Check Storage RLS policies in Supabase Dashboard

### Photos not displaying

1. Verify `photo_storage_path` is saved in database
2. Check that signed URL is being generated (browser console)
3. Confirm RLS policies allow SELECT on storage.objects
4. Try regenerating signed URL (expiry is 1 hour)

### RLS Policy Errors

If you get "Row Level Security" errors:

1. Ensure user is authenticated
2. Check policies are created correctly in Supabase Dashboard
3. Verify RLS is enabled on all tables
4. Review policy conditions match your use case

### Migration Errors

If migration fails:

1. Check for existing storage bucket with same name
2. Verify columns don't already exist
3. Review Supabase logs for detailed error messages
4. Try running migration SQL in smaller chunks

## Future Enhancements

### Short-term
- Add photo upload to "Create Player" page
- Implement photo cropping/rotation before upload
- Add batch photo upload for multiple players

### Medium-term
- Event photo galleries (tournaments, games)
- Team logos in storage
- Document storage (waivers, forms, rosters)

### Long-term
- User role-based RLS policies (admin, coach, parent)
- Photo history/versioning
- Video highlights storage
- Automatic image optimization (WebP conversion)
- Facial recognition for attendance tracking

## Performance Considerations

### Storage Usage
- Average photo size: ~300-500KB (after compression)
- 100 players ≈ 30-50MB storage
- Supabase free tier: 1GB storage

### Bandwidth
- Signed URLs cached by browser
- CDN delivery for fast loads
- Compressed images reduce transfer size

### Database Impact
- Minimal: Only storage paths stored in DB
- Indexed for fast lookups
- Trigger overhead negligible

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review this deployment guide
3. Check browser console for errors
4. Review Supabase Dashboard logs

## Rollback Plan

If you need to rollback:

```sql
-- Disable RLS (optional, if needed)
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
-- ... (repeat for other tables)

-- Remove new columns
ALTER TABLE players DROP COLUMN IF EXISTS photo_storage_path;
ALTER TABLE players DROP COLUMN IF EXISTS photo_updated_at;

-- Delete storage bucket (this will delete all photos!)
-- Only do this from Supabase Dashboard: Storage → player-photos → Settings → Delete Bucket
```

**Warning:** Deleting the storage bucket will permanently delete all uploaded photos.

## Conclusion

This implementation maximizes Supabase usage by:
1. Utilizing Supabase Storage (previously unused)
2. Implementing comprehensive RLS policies (critical security gap)
3. Optimizing file handling with compression and CDN delivery
4. Improving UX with proper photo upload and display

The app now leverages core Supabase features for better security, performance, and user experience.
