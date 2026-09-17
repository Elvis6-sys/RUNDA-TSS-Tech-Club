# 🔍 Build #18 Troubleshooting Guide

## What Build #18 Does

Build #18 adds **detailed debugging** to show exactly what's failing when the Next.js server tries to start.

---

## 📥 Download Instructions

**1. Check Build Status:**
- Go to: https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club/actions
- Wait until Build #18 shows ✅ (green checkmark) instead of ⏳ (in progress)
- Should take 5-10 minutes total

**2. Download:**
- Go to: https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club/releases
- Find: **"Windows Portable Build #18"** (should be at the top)
- Download: `RUNDA TSS Exam System-0.1.0-portable.zip` (~450MB)

**3. Extract:**
- Extract the ZIP to a new folder (e.g., `C:\RUNDA-Build-18`)
- Make sure to extract to a path **WITHOUT spaces** if possible (e.g., `C:\RUNDA18\`)

**4. Run:**
- Open the extracted folder
- Double-click: `RUNDA TSS Exam System.exe`

---

## 🔍 What to Check in the Logs

After running Build #18, open the log file:
- Location: `C:\Users\[YourUsername]\runda-debug.log`
- Or press `Win+R`, type: `%USERPROFILE%\runda-debug.log`, press Enter

### **Look for this section:**

```
🔍 SPAWN COMMAND DEBUG:
   Command: [THE ACTUAL COMMAND HERE]
   Args: [THE ACTUAL ARGUMENTS HERE]
   CWD: [THE WORKING DIRECTORY HERE]
   Shell: false
```

### **Then look for either:**

**SUCCESS (what we want to see):**
```
[Next.js]  ▲ Next.js 14.2.5
[Next.js] - Local: http://localhost:3001
[Next.js] ✓ Ready in 2.5s
```

**OR ERROR (what we need to diagnose):**
```
🚨 CRITICAL: Failed to spawn Next.js server process!
   Error: [ERROR MESSAGE HERE]
   Code: [ERROR CODE HERE]
```

---

## 🎯 Common Error Codes and Solutions

### **ENOENT** - File Not Found
```
Code: ENOENT
```
**Means:** The executable path is wrong  
**Fix:** We'll need to adjust how we find the Electron executable

### **EACCES / EPERM** - Permission Denied
```
Code: EACCES or EPERM
```
**Means:** Windows is blocking execution  
**Fix:** 
1. Right-click `RUNDA TSS Exam System.exe`
2. Properties → Unblock → Apply
3. Try again

### **UNKNOWN** - Unknown Error
```
Code: UNKNOWN
```
**Means:** Node.js can't run JavaScript files  
**Fix:** We might need to use `node.exe` from Electron's internals instead

---

## 📤 What to Send Me

If it still doesn't work, please send:

**1. The spawn debug section:**
```
🔍 SPAWN COMMAND DEBUG:
   [Copy the entire section here]
```

**2. Any error messages:**
```
🚨 CRITICAL: Failed to spawn...
   [Copy the entire error here]
```

**3. Brief description:**
- Does the window open? (Yes/No)
- Do you see the RUNDA logo? (Yes/No)
- Does it show "Connection Refused" error? (Yes/No)

---

## 💡 Quick Tip

If you want to save data on future downloads, you can:
1. Keep the `C:\RUNDA-Build-18\` folder
2. Only download new builds if the logs show we need to try again
3. The log file is tiny (~10KB) so you can share that via phone/email easily

---

## ⏱️ Timeline

- **Now:** Build #18 is compiling
- **5-10 min:** Build #18 will be ready for download
- **After you test:** Send me the logs
- **Within 30 min:** I'll analyze and create Build #19 with the real fix
- **Result:** App WILL work!

---

## 🙏 Thank You

I know this has been frustrating with your data constraints. I appreciate your patience and determination. With Build #18's debugging, we'll finally see the real issue and fix it properly!

---

**Build #18 Download:** https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club/releases  
**Check Build Status:** https://github.com/Elvis6-sys/RUNDA-TSS-Tech-Club/actions
