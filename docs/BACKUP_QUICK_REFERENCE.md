# Database Backup - Quick Reference

## Quick Test (5 minutes)

1. **Create test data:** Settings → "Create sample day log" (2-3 times)
2. **Export:** Click "Export JSON" → File downloads ✅
3. **Delete data:** Use browser DevTools → Clear IndexedDB
4. **Import:** Click "Import JSON" → Select file → Confirm → Data restored ✅

## Common Scenarios

### ✅ Export Works
- Button downloads `fitness-pwa-backup-YYYY-MM-DD.json`
- Success toast appears
- File contains all tables with your data

### ✅ Import Works  
- File picker opens
- Confirmation dialog appears
- Success toast after import
- Page reloads and data is restored

### ❌ Error Cases
- **Invalid JSON:** "Invalid JSON format" toast
- **Wrong format:** "Invalid backup format: missing schemaVersion" toast
- **Wrong version:** "Unsupported schema version" toast

## File Structure

Valid backup file must have:
```json
{
  "schemaVersion": 1,
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "data": {
    "profile": [],
    "day_logs": [...],
    ...
  }
}
```

## ⚠️ Important Notes

- **Import replaces ALL data** - always export first!
- Backup includes ALL tables (even empty ones)
- File name format: `fitness-pwa-backup-YYYY-MM-DD.json`

For detailed testing instructions, see [BACKUP_TESTING.md](./BACKUP_TESTING.md)

