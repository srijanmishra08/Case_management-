# eCase Integration - Deployment Checklist

## Pre-Deployment Verification

### ✅ Database Schema
- [x] Added `crn` column to clients table
- [x] Added `ecase_court_code` column to clients table
- [x] Added `import_source` column to clients table (default: 'manual')
- [x] Added `ecase_metadata` JSONB column to clients table
- [x] Updated ClientRecord interface
- [x] Migration runs automatically on app startup

### ✅ Backend Implementation
- [x] Created `src/lib/ecase.ts` with mock data
- [x] Added eCase helper functions to `src/lib/db.ts`
- [x] Created GET `/api/ecase/courts` endpoint
- [x] Created POST `/api/ecase/cases` endpoint
- [x] Created POST `/api/ecase/import` endpoint
- [x] All endpoints use authentication via `getCurrentUser()`
- [x] Updated `createClient()` to support eCase fields

### ✅ UI Components
- [x] Created `CourtSelector` component
- [x] Created `CRNList` component
- [x] Created `ClientAttachmentForm` component
- [x] All components styled with TailwindCSS
- [x] All components are responsive

### ✅ Pages
- [x] Created `/dashboard/import-ecase` page
- [x] Implemented multi-step workflow
- [x] Added progress indicator
- [x] Added error handling
- [x] Added success feedback

### ✅ Navigation Updates
- [x] Added "Import from eCase" to sidebar navigation
- [x] Added "Import from eCase" button to dashboard
- [x] Updated cases list to show CRN column
- [x] Updated cases list to show import source badge
- [x] Updated edit-case page to show CRN
- [x] Updated edit-case page to show import source badge

### ✅ Code Quality
- [x] TypeScript interfaces properly defined
- [x] Error handling in all async operations
- [x] Loading states implemented
- [x] Input validation (client and server side)
- [x] User-friendly error messages
- [x] Follows existing code patterns

## Testing Checklist

### Manual Testing Required

#### 1. Database Migration
- [ ] Start the application
- [ ] Verify no database errors in logs
- [ ] Check that clients table has new columns:
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'clients'
  AND column_name IN ('crn', 'ecase_court_code', 'import_source', 'ecase_metadata');
  ```

#### 2. Navigation
- [ ] Visit `/dashboard`
- [ ] Verify "Import from eCase" button is visible
- [ ] Click button and verify redirect to `/dashboard/import-ecase`
- [ ] Check sidebar for "Import from eCase" navigation item
- [ ] Verify icon displays correctly

#### 3. Import Flow - Court Selection
- [ ] Visit `/dashboard/import-ecase`
- [ ] Verify progress indicator shows Step 1 active
- [ ] Wait for courts to load (should see dropdown)
- [ ] Verify 8 courts are available in dropdown
- [ ] Select "Delhi High Court (DHC)"
- [ ] Verify selection updates

#### 4. Import Flow - Case Fetching
- [ ] After selecting court, verify "Fetch Cases" button appears
- [ ] Click "Fetch Cases"
- [ ] Verify loading state shows
- [ ] Wait for cases to load
- [ ] Verify cases appear in table
- [ ] Check that CRN, case title, parties, and filing date display

#### 5. Import Flow - Case Selection
- [ ] Click checkbox for one case
- [ ] Verify case is selected (checkbox checked)
- [ ] Verify selection count shows at bottom
- [ ] Click "Select All" checkbox
- [ ] Verify all cases are selected
- [ ] Uncheck one case
- [ ] Click "Proceed to Client Association"

#### 6. Import Flow - Client Association
- [ ] Verify form shows for each selected case
- [ ] For first case:
  - [ ] Select "Create New Client"
  - [ ] Enter client name (e.g., "Test Client")
  - [ ] Enter WhatsApp (e.g., "+919999999999")
- [ ] If you have existing clients:
  - [ ] Select second case
  - [ ] Select "Attach to Existing"
  - [ ] Select an existing client from dropdown
- [ ] Click "Import Cases"

#### 7. Import Flow - Success
- [ ] Verify loading state during import
- [ ] Wait for success message
- [ ] Verify success message shows:
  - Number of cases imported
  - Number of clients created
  - Number of clients updated
- [ ] Click "View All Cases"
- [ ] Verify redirect to `/dashboard/cases`

#### 8. Cases List Display
- [ ] Visit `/dashboard/cases`
- [ ] Verify imported cases appear
- [ ] Check that CRN column shows the CRN value
- [ ] Verify "eCase" badge appears for imported cases
- [ ] Verify manual cases don't have badge
- [ ] Check responsive behavior (hide CRN on mobile)

#### 9. Case Details Display
- [ ] Click on an imported case
- [ ] Verify "Imported from eCase" badge appears
- [ ] Check that CRN is displayed with document icon
- [ ] Verify court code shows if available
- [ ] Check that all case info is correct

#### 10. Error Handling
- [ ] Try importing same CRN twice (should show error)
- [ ] Try proceeding without selecting cases (should show error)
- [ ] Try importing without filling client name/WhatsApp (should validate)

#### 11. Edge Cases
- [ ] Test with no existing clients
- [ ] Test selecting multiple cases
- [ ] Test "Start Over" button
- [ ] Test back navigation between steps
- [ ] Test on mobile device
- [ ] Test with slow network (check loading states)

## Post-Deployment Monitoring

### Database Checks
```sql
-- Check imported cases
SELECT id, client_name, case_title, crn, import_source
FROM clients
WHERE import_source = 'ecase'
LIMIT 10;

-- Check metadata
SELECT crn, ecase_metadata
FROM clients
WHERE ecase_metadata IS NOT NULL
LIMIT 5;

-- Count by import source
SELECT import_source, COUNT(*)
FROM clients
GROUP BY import_source;
```

### Log Monitoring
- [ ] Check application logs for errors
- [ ] Monitor API endpoint response times
- [ ] Check for any database query issues

### Performance Checks
- [ ] Verify page load times
- [ ] Check API response times
- [ ] Monitor database query performance

## Known Limitations

### Current Implementation
1. **Mock Data**: Currently using mock data for eCase API
   - 8 predefined courts
   - Sample cases for each court
   - Simulated API delays (500-800ms)

2. **No Real-time Sync**: Cases are imported as snapshots
   - No automatic updates from eCase
   - Manual re-import required for updates

3. **No Bulk Operations**: Import one court at a time
   - Cannot import from multiple courts simultaneously
   - No bulk edit of imported cases

4. **Basic Validation**: Simple validation rules
   - CRN uniqueness per user
   - Basic field validation

### Future Enhancements Needed
1. Real eCase API integration
2. Automatic case status sync
3. Bulk import from multiple courts
4. Case update notifications
5. Advanced search by CRN
6. Export functionality
7. Import history tracking
8. Duplicate detection improvements

## Rollback Plan

If issues occur after deployment:

1. **Disable Import Feature**
   - Remove navigation item from `layout.tsx`
   - Remove button from `dashboard/page.tsx`
   - Users can still see imported cases

2. **Database Rollback** (if needed)
   ```sql
   -- Remove eCase columns (only if absolutely necessary)
   ALTER TABLE clients DROP COLUMN IF EXISTS crn;
   ALTER TABLE clients DROP COLUMN IF EXISTS ecase_court_code;
   ALTER TABLE clients DROP COLUMN IF EXISTS import_source;
   ALTER TABLE clients DROP COLUMN IF EXISTS ecase_metadata;
   ```

3. **Code Rollback**
   - Revert changes to modified files
   - Remove new files and directories

## Documentation

### User Documentation Needed
- [ ] How to import cases from eCase
- [ ] Understanding CRN and import source
- [ ] Troubleshooting import issues
- [ ] FAQ about eCase integration

### Developer Documentation
- [x] Implementation summary (ECASE_IMPLEMENTATION_SUMMARY.md)
- [x] Architecture diagram (ECASE_ARCHITECTURE.md)
- [x] Deployment checklist (this file)
- [ ] API endpoint documentation
- [ ] Database schema documentation

## Sign-off

### Development
- [x] Code implemented
- [x] Self-tested in development
- [ ] Code review completed
- [ ] Unit tests written (if applicable)

### QA
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Performance tested
- [ ] Security tested

### Deployment
- [ ] Database migration tested
- [ ] Staging deployment successful
- [ ] Production deployment approved
- [ ] Monitoring setup complete

## Support Information

### Common Issues and Solutions

**Issue**: Courts not loading
- **Solution**: Check API endpoint is accessible, verify authentication

**Issue**: Cases not appearing after import
- **Solution**: Check browser console for errors, verify API response

**Issue**: CRN column not showing
- **Solution**: Verify database migration ran successfully

**Issue**: Import fails with duplicate error
- **Solution**: Case already imported, check existing cases

### Contact
For issues or questions:
- Check application logs
- Review error messages in browser console
- Check database for data integrity
- Refer to implementation documentation

## Approval

- [ ] Development Lead: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______
