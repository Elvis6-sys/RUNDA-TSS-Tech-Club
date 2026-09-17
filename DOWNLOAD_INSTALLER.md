# 📥 Download RUNDA TSS Exam System - Build #23

## ⚡ Quick Download

**Latest Release:** [Build #23 - Windows Portable](https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club/releases/latest)

---

## 🔧 What's Fixed in Build #23

### ✅ Critical Server Fix - THE SOLUTION!

**Problem:** Server was failing to start because we tried to run `.exe` as Node.js  
**Solution:** Switched to `utilityProcess.fork()` - Electron's official API for Node scripts

### Technical Details

#### Before (Build #22 and earlier):
```javascript
// ❌ WRONG: Tried to spawn RUNDA TSS Exam System.exe as Node.js
const nodeExe = path.join(exeDir, 'node.exe');  // This doesn't exist!
nextServer = spawn(nodeExe, [serverJs], {...});
```

**Result:** `ERR_CONNECTION_REFUSED` - server never started

#### After (Build #23):
```javascript
// ✅ CORRECT: Use Electron's embedded Node.js
nextServer = utilityProcess.fork(serverJs, [], {
  cwd: cwd,
  env: {...}
});
```

**Result:** Server starts using Electron's built-in Node.js runtime!

### Why This Works

- **Electron embeds Node.js** - No separate `node.exe` file exists
- **`utilityProcess.fork()`** - Designed specifically for running Node scripts in packaged Electron apps
- **Proper execution context** - Runs in Node.js environment, not trying to execute through .exe

---

## 📦 Installation Instructions

### Step 1: Download the ZIP

Go to: https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club/releases

Download: **`RUNDA TSS Exam System-0.1.0-portable.zip`** (~ 450 MB)

### Step 2: Extract the ZIP

1. Right-click the downloaded ZIP file
2. Choose "Extract All..." 
3. Extract to a folder like `C:\RUNDA TSS` or `Desktop\RUNDA TSS`
4. **IMPORTANT:** Extract the FULL folder, don't run from inside the ZIP!

### Step 3: Run the Application

1. Open the extracted folder
2. Find `RUNDA TSS Exam System.exe`
3. Double-click to launch
4. **(Optional)** Right-click → Send to → Desktop to create a shortcut

### Step 4: First Launch

- Windows Defender might show a warning (click "Run anyway")
- The app will:
  - Initialize the database
  - Start the Next.js server (10-15 seconds)
  - Open the login screen

---

## 🔑 Login Credentials

### Admin Account
- **Email:** `leotuyi10@gmail.com`
- **Password:** `12345678`
- **Access:** Full system control

### Trainer Account
- **Email:** `leotuyi100@gmail.com`
- **Password:** `12345678`
- **Access:** Create exams, grade students

### Student Account
- Create via admin dashboard or register during first launch

---

## ⚙️ System Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 10 (64-bit) or Windows 11 |
| **RAM** | 4GB minimum, 8GB recommended |
| **Disk Space** | 1.5GB after extraction |
| **Screen Resolution** | 1280x720 minimum |
| **Internet** | ❌ NOT required (fully offline) |

---

## 🐛 Troubleshooting

### Issue: "Windows protected your PC" message

**Solution:**
1. Click "More info"
2. Click "Run anyway"
3. This is normal for unsigned applications

### Issue: Blank white screen on launch

**This should be FIXED in Build #23!** If you still see this:

1. Close the app completely
2. Delete the database: `C:\Users\YourName\.config\runda-tss-tech-club\app.db`
3. Re-launch the app
4. If still failing, check logs at: `C:\Users\YourName\runda-debug.log`

### Issue: "Cannot find module" errors

**This should be FIXED!** But if you see this:

1. Make sure you extracted the FULL ZIP
2. Don't run from inside the ZIP file
3. Re-extract to a fresh folder

### Issue: Port 3001 already in use

**Solution:**
1. Close all RUNDA TSS windows
2. Open Task Manager (Ctrl+Shift+Esc)
3. End any "RUNDA TSS Exam System" processes
4. Re-launch

---

## 📊 Build History

### Build #23 - ✅ **SERVER FIX** (Current)
- **Fix:** Use `utilityProcess.fork()` for server startup
- **Result:** Server now runs with Electron's embedded Node.js
- **Status:** Should finally work! 🎉

### Build #22 - ❌ Server Connection Refused
- **Fix:** Attempted to find node.exe in exe directory
- **Problem:** node.exe doesn't exist separately in Electron
- **Result:** `ERR_CONNECTION_REFUSED` - blank screen

### Build #21 - ❌ Server Spawn Failed
- **Fix:** Module loading improvements
- **Problem:** Tried to run .exe as Node.js
- **Result:** Server spawned but couldn't execute JS

### Builds #1-20 - Various Issues
- NSIS installer corruption (>450MB file size)
- Module resolution errors
- Asar packaging issues
- File path problems

---

## 🔍 Verify Installation

After launching, check for these signs of success:

✅ **Electron window opens** (no crash)  
✅ **Database initializes** (see "Initializing..." message)  
✅ **Login page loads** (not blank screen)  
✅ **Can type in login form** (page is responsive)  
✅ **Login works** (credentials above)

---

## 📞 Support

### If Build #23 Still Has Issues

Please send the log file:
1. Go to: `C:\Users\YourName\runda-debug.log`
2. Copy the full contents
3. Share in the issue report

**Critical info needed:**
- Exact error message
- When the error occurs (startup, login, during exam, etc.)
- Screenshot of the issue
- Contents of `runda-debug.log`

---

## 🎯 What's Next

If Build #23 works:
- ✅ Mark as stable release
- ✅ Create installer version (NSIS or Squirrel)
- ✅ Add auto-update system
- ✅ Code signing for trusted publisher

If Build #23 fails:
- Consider alternative architecture (static export instead of server mode)
- Or bundle Node.js separately alongside Electron
- Or use different packaging approach

---

**Last Updated:** Build #23 (Current)  
**Repository:** https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club  
**Actions:** https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club/actions
