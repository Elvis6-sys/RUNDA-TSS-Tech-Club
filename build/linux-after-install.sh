#!/bin/bash
# Post-installation script for Linux

# Set executable permissions
chmod +x /opt/RUNDA\ TSS\ Exam\ System/runda-tss-exam-system

# Create symlink in /usr/local/bin (optional)
# ln -sf "/opt/RUNDA TSS Exam System/runda-tss-exam-system" /usr/local/bin/runda-exam

# Print success message
echo "✅ RUNDA TSS Exam System installed successfully!"
echo "   Launch from Applications menu or run: runda-tss-exam-system"
