# 🪟 Build Windows Installer Manually

Since GitHub Actions is blocked due to billing, follow these steps to build on a Windows machine.

---

## ✅ Requirements

- Windows 10 or 11
- Internet connection
- Git installed
- Node.js 18+ installed

---

## 📋 Step-by-Step Instructions

### 1. Clone Repository on Windows

```powershell
# Open PowerShell or Command Prompt
cd C:\
git clone https://github.com/Leonardusinhos96/RUNDA-TSS-Tech-Club.git
cd RUNDA-TSS-Tech-Club
```

### 2. Install Dependencies

```powershell
npm install
```

This will take 5-10 minutes (downloads ~500MB of packages).

### 3. Build the Windows Installer

```powershell
npm run build:electron
```

**What happens**:
1. Builds Next.js production bundle (~2 minutes)
2. Compiles Electron app (~1 minute)
3. Creates Windows `.exe` installer (~5 minutes)

**Total time**: ~10-15 minutes

### 4. Find Your Installer

After successful build, find:

```
dist-electron/
├── RUNDA-TSS-Installer-1.0.0-Setup.exe  ← This is your installer!
└── win-unpacked/                         ← Portable version
```

---

## 🚀 Install and Test

1. **Double-click** `RUNDA-TSS-Installer-1.0.0-Setup.exe`
2. **Follow installation wizard**
3. **Launch app** from Desktop or Start Menu
4. **Login** with:
   - Admin: `leotuyi10@gmail.com` / `12345678`
   - Trainer: `leotuyi100@gmail.com` / `12345678`

---

## 🐛 Troubleshooting

### Error: "npm not found"
**Install Node.js**: https://nodejs.org/en/download/

### Error: "git not found"
**Install Git**: https://git-scm.com/download/win

### Build fails at "electron-builder"
**Run as Administrator**:
```powershell
# Right-click PowerShell → "Run as Administrator"
cd C:\RUNDA-TSS-Tech-Club
npm run build:electron
```

### Port 3001 already in use
**Kill the process**:
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

---

## 📦 Share the Installer

Upload to:
- Google Drive
- Dropbox
- WeTransfer
- USB drive

Then share with students/teachers!

---

## 🔄 Rebuild After Code Changes

```powershell
# Pull latest changes
git pull origin main

# Rebuild
npm run build:electron
```

---

## 💡 Alternative: Use Linux to Build Windows Installer

If you don't have Windows, you can build from Linux Mint using Wine:

```bash
# Install Wine
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine64 wine32

# Build
npm run build:electron
```

**Note**: Wine builds may have issues. Real Windows machine is recommended.

---

**Once GitHub billing is fixed, automated builds via GitHub Actions will work!**
