// No-op code signing script — skips all signing.
// Used during development builds where no certificate is available.
// electron-builder calls this instead of signtool.exe when win.sign points here.
exports.default = async function(_configuration) {
  // intentionally do nothing — no signing
};
