# Avatar Upload Troubleshooting Guide

## Common Issues and Solutions

### 1. **Permission Denied Errors**
**Error**: `Permission denied. Please check Firebase Storage rules.`

**Solutions**:
- Check Firebase Storage Rules in Firebase Console
- Ensure rules allow authenticated users to upload:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /customers/{customerId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. **Image Picker Permission Issues**
**Error**: `Permission Required. Please grant permission to access your photo library`

**Solutions**:
- The app now automatically requests permissions
- If still failing, check device settings manually
- On iOS: Settings > Privacy & Security > Photos > [Your App]
- On Android: Settings > Apps > [Your App] > Permissions > Storage

### 3. **File Size Issues**
**Error**: `Image size too large. Please choose an image smaller than 5MB.`

**Solutions**:
- The app now validates file size before upload
- Reduce image quality in camera settings
- Use image compression apps before selecting

### 4. **Network/Connectivity Issues**
**Error**: `Unknown storage error. Please check your internet connection.`

**Solutions**:
- Check internet connectivity
- Try switching between WiFi and mobile data
- Restart the app if connection was restored

### 5. **Invalid Image URI Format**
**Error**: `Invalid image URI format: [URI]...`

**Solutions**:
- This error occurs when the image picker returns an unexpected URI format
- Check console logs for the exact URI format being used
- Supported URI formats include:
  - `file://` (most common)
  - `content://` (Android)
  - `assets-library://` (iOS)
  - `ph://` (iOS Photos)
  - `/var/` (iOS file paths)
  - `/storage/` (Android file paths)
- Try selecting images from different sources (camera vs gallery)
- Restart the app and try again

### 6. **Invalid Image File**
**Error**: `Invalid image file - file appears to be empty`

**Solutions**:
- Ensure the selected file is a valid image
- Try selecting a different image
- Check if the image file is corrupted

## Debugging Steps

### 1. **Enable Console Logging**
The upload function now includes detailed logging. Check the console for:
- `Image picker result: { uri, type, fileSize, width, height }`
- `Starting avatar upload for customer: [ID]`
- `Image URI: [URI]`
- `Image blob size: [SIZE] bytes`
- `Image blob type: [TYPE]`
- `Uploading to Firebase Storage...`
- `Avatar upload completed successfully: [URL]`

### 2. **URI Format Debugging**
If you get "Invalid image URI format" error:
1. Check the console for `Image picker result:` log
2. Note the exact URI format being returned
3. Compare with supported formats listed above
4. If URI format is new/unexpected, it may need to be added to validation

### 2. **Check Firebase Console**
- Go to Firebase Console > Storage
- Look for files under `customers/[customerId]/`
- Check if files are being created but URLs not returned

### 3. **Test with Different Images**
- Try with a small (< 1MB) image first
- Test with different formats (JPG, PNG)
- Use images from different sources (camera vs gallery)

## Enhanced Features

### 1. **Automatic Validation**
- File size validation (5MB limit)
- URI format validation
- Permission checking before picker launch

### 2. **Better Error Messages**
- Specific error messages for different failure types
- User-friendly language
- Actionable suggestions

### 3. **Improved User Experience**
- Loading states during upload
- Progress feedback
- Graceful degradation (customer creation succeeds even if avatar fails)

### 4. **Platform Compatibility**
- Works on iOS, Android, and Web
- Handles different URI formats
- Proper permission handling per platform

## Firebase Storage Configuration

Ensure your Firebase Storage is properly configured:

1. **Enable Firebase Storage** in your Firebase project
2. **Set up proper security rules** (see above)
3. **Check quota limits** in Firebase Console
4. **Verify billing account** if using Blaze plan

## Testing Checklist

- [ ] Permissions granted for photo library access
- [ ] Internet connection stable
- [ ] Firebase Storage rules allow uploads
- [ ] Image file size under 5MB
- [ ] Valid image format (JPG, PNG, etc.)
- [ ] Firebase project properly configured
- [ ] Console shows detailed upload logs

## Still Having Issues?

If problems persist:
1. Check the console logs for specific error messages
2. Test with a minimal image (< 100KB)
3. Verify Firebase project configuration
4. Try on a different device/platform
5. Check Firebase Storage usage quotas
