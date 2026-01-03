# Database Backup & Restore - Testing Guide

This guide provides step-by-step instructions to test the database export and import functionality.

## Prerequisites

1. Make sure the app is running (`npm run dev`)
2. Navigate to the Settings page (`/settings`)
3. Have some test data in your database (use the "DB Smoke Test" section to create sample day logs)

---

## Test 1: Basic Export

**Goal:** Verify that exporting creates a valid JSON file with all database tables.

### Steps:

1. **Create some test data:**
   - In the Settings page, click "Create sample day log" button
   - Verify it appears in "Today's Logs" section
   - Repeat 2-3 times to create multiple records

2. **Export the database:**
   - Click the "Export JSON" button
   - A success toast should appear: "Database exported successfully!"
   - Check your Downloads folder for a file named `fitness-pwa-backup-YYYY-MM-DD.json` (where YYYY-MM-DD is today's date)

3. **Verify the export file:**
   - Open the downloaded JSON file in a text editor
   - Verify it has this structure:
     ```json
     {
       "schemaVersion": 1,
       "exportedAt": "2024-01-15T10:30:00.000Z",
       "data": {
         "profile": [...],
         "workouts": [...],
         "day_logs": [...],
         ...
       }
     }
     ```
   - Check that `day_logs` contains the records you created
   - Verify all other tables are present (even if empty arrays)

**Expected Result:** ✅ File downloads successfully with correct structure and all your data

---

## Test 2: Basic Import (Restore)

**Goal:** Verify that importing restores data correctly.

### Steps:

1. **Delete existing data:**
   - Use browser DevTools (F12) → Application tab → IndexedDB → LifestyleAssistantDB
   - Or simply delete all day logs using the app if you have a delete feature
   - Refresh the page and verify the data is gone

2. **Import the backup:**
   - Click the "Import JSON" button
   - Select the `fitness-pwa-backup-YYYY-MM-DD.json` file you exported in Test 1
   - A confirmation dialog appears: "This will overwrite your current database..."
   - Click "OK" to confirm
   - A success toast should appear: "Database imported successfully!"
   - The page will reload after 1 second

3. **Verify the restore:**
   - After the page reloads, check the "Today's Logs" section
   - Click "List today" button
   - Verify all your previously created day logs are restored

**Expected Result:** ✅ All data is restored exactly as it was before deletion

---

## Test 3: Import Overwrite Confirmation

**Goal:** Verify that the overwrite confirmation works correctly.

### Steps:

1. **Create some new data:**
   - Create a new day log using "Create sample day log"
   - Note the ID of this new log

2. **Attempt to import (but cancel):**
   - Click "Import JSON"
   - Select your backup file from Test 1
   - When the confirmation dialog appears, click "Cancel"
   - Verify no toast appears
   - Check that your new day log still exists (click "List today")

**Expected Result:** ✅ Import is cancelled, existing data remains unchanged

---

## Test 4: Error Handling - Invalid JSON File

**Goal:** Verify that invalid JSON files are rejected with a clear error message.

### Steps:

1. **Create an invalid JSON file:**
   - Create a text file named `invalid.json`
   - Add invalid JSON content: `{ "invalid": json, }` (missing quotes, trailing comma)
   - Save the file

2. **Attempt to import:**
   - Click "Import JSON"
   - Select the `invalid.json` file
   - Click "OK" on the confirmation dialog

**Expected Result:** ✅ Error toast appears: "Invalid JSON format"

---

## Test 5: Error Handling - Wrong File Format

**Goal:** Verify that files with wrong structure are rejected.

### Steps:

1. **Create a valid JSON but wrong structure:**
   - Create a file `wrong-format.json` with content:
     ```json
     {
       "someOtherData": "not a backup file"
     }
     ```

2. **Attempt to import:**
   - Click "Import JSON"
   - Select `wrong-format.json`
   - Click "OK" on confirmation

**Expected Result:** ✅ Error toast appears: "Invalid backup format: missing schemaVersion"

---

## Test 6: Error Handling - Wrong Schema Version

**Goal:** Verify that backups with unsupported schema versions are rejected.

### Steps:

1. **Create a backup file with wrong version:**
   - Create a file `wrong-version.json` with content:
     ```json
     {
       "schemaVersion": 999,
       "exportedAt": "2024-01-15T10:30:00.000Z",
       "data": {}
     }
     ```

2. **Attempt to import:**
   - Click "Import JSON"
   - Select `wrong-version.json`
   - Click "OK" on confirmation

**Expected Result:** ✅ Error toast appears: "Unsupported schema version: 999"

---

## Test 7: Empty Database Export/Import

**Goal:** Verify that empty databases can be exported and imported.

### Steps:

1. **Clear all data:**
   - Use browser DevTools to clear IndexedDB, or manually delete all records
   - Refresh the page

2. **Export empty database:**
   - Click "Export JSON"
   - Verify success toast appears
   - Open the exported file
   - Verify all tables are present but with empty arrays: `"day_logs": []`

3. **Import the empty backup:**
   - Create some test data first
   - Click "Import JSON"
   - Select the empty backup file
   - Confirm the import
   - Verify all data is cleared after import

**Expected Result:** ✅ Empty database exports correctly, and importing it clears existing data

---

## Test 8: Multiple Tables Export/Import

**Goal:** Verify that all tables are exported and imported correctly.

### Steps:

1. **Create data in multiple tables:**
   - Use the app to create:
     - Day logs (via Settings page)
     - Workouts (if you have that feature)
     - Recipes/Meals (if you have that feature)
     - Any other data you can create

2. **Export:**
   - Click "Export JSON"
   - Open the file and verify all tables with data are present

3. **Clear and restore:**
   - Clear IndexedDB via DevTools
   - Import the backup
   - Verify all data types are restored

**Expected Result:** ✅ All tables with data are exported and restored correctly

---

## Test 9: File Name Format

**Goal:** Verify the exported file has the correct naming format.

### Steps:

1. **Export on different days:**
   - Export today: should be `fitness-pwa-backup-2024-01-15.json` (example)
   - Wait until tomorrow (or change system date)
   - Export again: should be `fitness-pwa-backup-2024-01-16.json`

**Expected Result:** ✅ File names follow the pattern `fitness-pwa-backup-YYYY-MM-DD.json`

---

## Test 10: Large Dataset

**Goal:** Verify export/import works with larger amounts of data.

### Steps:

1. **Create many records:**
   - Create 50+ day logs (you may need to script this or use DevTools)
   - Or create records across multiple days

2. **Export:**
   - Click "Export JSON"
   - Verify the file size is reasonable (should be a few KB to MB depending on data)
   - Open and verify all records are present

3. **Import:**
   - Clear database
   - Import the backup
   - Verify all records are restored

**Expected Result:** ✅ Large datasets export and import without issues

---

## Quick Test Checklist

Use this checklist for a quick smoke test:

- [ ] Export button downloads a file
- [ ] Exported file has correct name format
- [ ] Exported file contains all tables
- [ ] Import button opens file picker
- [ ] Import shows confirmation dialog
- [ ] Import cancels correctly when user clicks Cancel
- [ ] Import restores data after deletion
- [ ] Success toast appears on successful export
- [ ] Success toast appears on successful import
- [ ] Error toast appears on invalid file
- [ ] Page reloads after successful import

---

## Troubleshooting

### Export doesn't download file
- Check browser download settings (not blocked)
- Check browser console for errors
- Verify you have some data in the database

### Import doesn't work
- Verify the file is a valid JSON backup from this app
- Check browser console for specific error messages
- Ensure you clicked "OK" on the confirmation dialog

### Data not restoring
- Verify the backup file contains the data you expect
- Check that you're looking in the right place after import
- Try refreshing the page manually if auto-reload didn't work

---

## Notes

- All exports use schema version 1
- Import replaces ALL existing data (destructive operation)
- Always confirm you have a recent backup before importing
- The backup includes ALL tables, even if they're empty

