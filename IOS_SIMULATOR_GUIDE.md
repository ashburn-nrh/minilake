# 📱 iOS Simulator Testing Guide

## ✅ Temporary Solution for iOS Simulator

Since Phone OTP doesn't work on iOS Simulator, I've added a **Dev Mode bypass** that lets you skip login and test the app.

---

## 🚀 How to Use

### 1. Enable Anonymous Auth in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **minilake**
3. Go to **Authentication** → **Sign-in method**
4. Click **Anonymous**
5. Toggle **Enable**
6. Click **Save**

### 2. Run on iOS Simulator

```bash
npm start
# Press 'i' to open iOS Simulator
```

### 3. Use Dev Mode Button

On the login screen, you'll see:
- 🧪 **SIMULATOR MODE** label
- **"Skip Login (Dev Mode)"** button (orange)
- This button ONLY appears on iOS Simulator (not on physical devices or web)

Click the button to:
- Sign in anonymously
- Skip phone verification
- Go directly to customers screen

---

## 🎯 What You Can Test

Once logged in via Dev Mode, you can test:

✅ **Customers List**
- Add new customers
- Search customers
- Filter by tags
- Sort by recent/name
- Edit customer details
- Delete customers

✅ **Customer Detail**
- View customer profile
- Edit customer info
- Upload avatar
- Add engagements
- Update engagement status (inline)
- Upload attachments

✅ **Logout**
- Logout button works
- Returns to login screen

---

## 🔒 Security

### Dev Mode is SAFE because:
1. **Only works on iOS Simulator** - Checks `!Device.isDevice`
2. **Not visible on physical devices** - Button won't show
3. **Not visible on web** - Only for iOS simulator
4. **Uses Firebase Anonymous Auth** - Proper Firebase authentication
5. **Can be removed for production** - Just delete the button code

### For Production:
Remove the dev mode button before deploying:
```typescript
// In app/login.tsx, remove this section:
{isSimulator && (
  <View className="mt-6 pt-6 border-t border-gray-200">
    ...Dev Mode Button...
  </View>
)}
```

---

## 🧪 Testing Workflow

### On iOS Simulator:
1. Open app → Login screen
2. Click "Skip Login (Dev Mode)"
3. Test all features
4. Click Logout
5. Repeat

### On Web Browser:
1. Open app → Login screen
2. Use test phone: `+1 555 123 4567`
3. Use test OTP: `123456`
4. Test all features

### On Physical Device:
- Dev Mode button won't appear
- Must use real phone OTP
- Or add test phone numbers in Firebase

---

## 📊 Comparison

| Platform | Login Method | Dev Mode Button |
|----------|--------------|-----------------|
| **iOS Simulator** | Dev Mode (Anonymous) | ✅ Visible |
| **iOS Device** | Phone OTP | ❌ Hidden |
| **Android Simulator** | Shows web message | ❌ Hidden |
| **Android Device** | Phone OTP | ❌ Hidden |
| **Web Browser** | Phone OTP | ❌ Hidden |

---

## 🔧 How It Works

### Code Added to `app/login.tsx`:

```typescript
// Import anonymous auth
import { signInAnonymously } from 'firebase/auth';
import * as Device from 'expo-device';

// Check if simulator
const isSimulator = Platform.OS === 'ios' && !Device.isDevice;

// Dev mode login function
const handleDevModeLogin = async () => {
  await signInAnonymously(auth);
  router.replace('/customers');
};

// Button (only shows on simulator)
{isSimulator && (
  <TouchableOpacity onPress={handleDevModeLogin}>
    <Text>Skip Login (Dev Mode)</Text>
  </TouchableOpacity>
)}
```

---

## ⚠️ Limitations

### Anonymous Auth:
- Each simulator session gets a new user ID
- Data won't persist between app reinstalls
- Can't share data with other users

### For Real Testing:
- Use web browser with test phone numbers
- Or use physical iOS device
- Or set up @react-native-firebase for native support

---

## 🎉 Benefits

✅ **Test on iOS Simulator** without SMS
✅ **Test all app features** immediately
✅ **Fast development** workflow
✅ **No SMS costs** during development
✅ **Safe** - only works on simulator
✅ **Easy to remove** for production

---

## 📝 Next Steps

### For Development:
1. ✅ Use Dev Mode on iOS Simulator
2. ✅ Test all features
3. ✅ Iterate quickly

### For Production:
1. Remove Dev Mode button
2. Test on physical devices
3. Use real phone OTP
4. Deploy to App Store

---

## 🐛 Troubleshooting

### Button doesn't appear:
- Make sure you're on iOS Simulator (not physical device)
- Check that `expo-device` is installed
- Restart the app

### Anonymous auth fails:
- Enable Anonymous auth in Firebase Console
- Check Firebase credentials in `.env`
- Check console logs for errors

### Can't see customers:
- Anonymous users get a unique ID
- Each session is isolated
- Add test customers after login

---

## ✨ Summary

**Problem**: Phone OTP doesn't work on iOS Simulator
**Solution**: Dev Mode button with anonymous auth
**Result**: Can test entire app on iOS Simulator!

**Status**: ✅ **READY TO TEST ON iOS SIMULATOR**

---

**Press 'i' in your terminal to open iOS Simulator and try it!** 🚀
