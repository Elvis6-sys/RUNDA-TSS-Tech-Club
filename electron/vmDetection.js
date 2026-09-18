/**
 * Virtual Machine Detection
 * 
 * Detects if app is running inside a virtual machine by checking:
 * - System manufacturer/model strings
 * - Hardware characteristics (CPU features, MAC addresses)
 * - Common VM processes
 * - Registry keys (Windows)
 * - DMI/SMBIOS data (Linux)
 * 
 * Used to prevent students from running exams in VMs where they might
 * bypass security restrictions or use snapshot/restore to cheat.
 */

const { exec } = require('child_process');
const os = require('os');
const util = require('util');
const execPromise = util.promisify(exec);

class VMDetector {
  constructor() {
    this.vmSignals = [];
    this.isVM = false;
    this.confidence = 0; // 0-100
    this.detectionMethods = [];
  }

  /**
   * Run all VM detection checks
   * Returns { isVM: boolean, confidence: number, signals: array, methods: array }
   */
  async detect() {
    this.vmSignals = [];
    this.detectionMethods = [];

    const platform = process.platform;
    
    try {
      if (platform === 'win32') {
        await this.detectWindows();
      } else if (platform === 'linux') {
        await this.detectLinux();
      } else if (platform === 'darwin') {
        await this.detectMacOS();
      }

      // Calculate confidence based on signals found
      this.confidence = Math.min(100, this.vmSignals.length * 25);
      this.isVM = this.confidence >= 50; // 50%+ confidence = likely VM

      console.log(`🖥️  [VM DETECTION] Platform: ${platform}`);
      console.log(`🖥️  [VM DETECTION] Signals found: ${this.vmSignals.length}`);
      console.log(`🖥️  [VM DETECTION] Confidence: ${this.confidence}%`);
      console.log(`🖥️  [VM DETECTION] Is VM: ${this.isVM ? 'YES ⚠️' : 'NO ✅'}`);

      if (this.vmSignals.length > 0) {
        console.log(`🖥️  [VM DETECTION] Signals:`, this.vmSignals);
      }

    } catch (error) {
      console.error(`❌ [VM DETECTION] Error:`, error.message);
    }

    return {
      isVM: this.isVM,
      confidence: this.confidence,
      signals: this.vmSignals,
      methods: this.detectionMethods,
      platform
    };
  }

  /**
   * Windows-specific VM detection
   */
  async detectWindows() {
    // Check system manufacturer via WMIC
    try {
      const { stdout: manufacturer } = await execPromise('wmic computersystem get manufacturer');
      const mfg = manufacturer.toLowerCase();

      const vmVendors = ['vmware', 'virtualbox', 'qemu', 'xen', 'parallels', 'microsoft corporation'];
      for (const vendor of vmVendors) {
        if (mfg.includes(vendor)) {
          this.vmSignals.push(`Manufacturer contains "${vendor}"`);
          this.detectionMethods.push('wmic_manufacturer');
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Check system model
    try {
      const { stdout: model } = await execPromise('wmic computersystem get model');
      const mdl = model.toLowerCase();

      if (mdl.includes('virtual') || mdl.includes('vmware') || mdl.includes('virtualbox')) {
        this.vmSignals.push(`Model contains VM keywords: "${mdl.trim()}"`);
        this.detectionMethods.push('wmic_model');
      }
    } catch (e) {
      // Ignore errors
    }

    // Check BIOS
    try {
      const { stdout: bios } = await execPromise('wmic bios get manufacturer');
      const biosStr = bios.toLowerCase();

      const vmBios = ['vmware', 'virtualbox', 'qemu', 'xen', 'parallels', 'bochs', 'seabios'];
      for (const vendor of vmBios) {
        if (biosStr.includes(vendor)) {
          this.vmSignals.push(`BIOS contains "${vendor}"`);
          this.detectionMethods.push('wmic_bios');
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Check for VM-specific processes
    const vmProcesses = [
      'vmtoolsd.exe',      // VMware Tools
      'VBoxService.exe',   // VirtualBox Guest Additions
      'VBoxTray.exe',      // VirtualBox
      'qemu-ga.exe',       // QEMU Guest Agent
      'vmmouse.exe',       // VMware mouse
      'vmacthlp.exe',      // VMware activation helper
    ];

    try {
      const { stdout: processes } = await execPromise('tasklist /FO CSV /NH');
      const procList = processes.toLowerCase();

      for (const vmProc of vmProcesses) {
        if (procList.includes(vmProc.toLowerCase())) {
          this.vmSignals.push(`VM process detected: ${vmProc}`);
          this.detectionMethods.push('process_scan');
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Linux-specific VM detection
   */
  async detectLinux() {
    // Check DMI/SMBIOS system info
    try {
      const { stdout: product } = await execPromise('cat /sys/devices/virtual/dmi/id/product_name 2>/dev/null || echo ""');
      const productName = product.toLowerCase().trim();

      const vmProducts = ['vmware', 'virtualbox', 'qemu', 'kvm', 'xen', 'bochs', 'parallels'];
      for (const vm of vmProducts) {
        if (productName.includes(vm)) {
          this.vmSignals.push(`Product name contains "${vm}": ${productName}`);
          this.detectionMethods.push('dmi_product');
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Check system vendor
    try {
      const { stdout: vendor } = await execPromise('cat /sys/devices/virtual/dmi/id/sys_vendor 2>/dev/null || echo ""');
      const vendorName = vendor.toLowerCase().trim();

      const vmVendors = ['vmware', 'innotek', 'qemu', 'xen', 'parallels', 'microsoft'];
      for (const vm of vmVendors) {
        if (vendorName.includes(vm)) {
          this.vmSignals.push(`Vendor contains "${vm}": ${vendorName}`);
          this.detectionMethods.push('dmi_vendor');
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Check for hypervisor flag in CPU
    try {
      const { stdout: cpuinfo } = await execPromise('cat /proc/cpuinfo | grep hypervisor');
      if (cpuinfo.trim()) {
        this.vmSignals.push('CPU hypervisor flag detected');
        this.detectionMethods.push('cpu_hypervisor');
      }
    } catch (e) {
      // No hypervisor flag (good)
    }

    // Check for VM-specific kernel modules
    const vmModules = ['vmw_balloon', 'vmw_vmci', 'vmw_vsock', 'vboxguest', 'vboxsf'];
    try {
      const { stdout: modules } = await execPromise('lsmod');
      const moduleList = modules.toLowerCase();

      for (const vmMod of vmModules) {
        if (moduleList.includes(vmMod)) {
          this.vmSignals.push(`VM kernel module loaded: ${vmMod}`);
          this.detectionMethods.push('kernel_modules');
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Check for VM-specific devices
    try {
      const { stdout: devices } = await execPromise('lspci 2>/dev/null || echo ""');
      const deviceList = devices.toLowerCase();

      const vmDevices = ['vmware', 'virtualbox', 'qemu', 'virtio'];
      for (const vm of vmDevices) {
        if (deviceList.includes(vm)) {
          this.vmSignals.push(`VM PCI device detected: ${vm}`);
          this.detectionMethods.push('pci_devices');
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * macOS-specific VM detection
   */
  async detectMacOS() {
    // Check hardware model
    try {
      const { stdout: model } = await execPromise('sysctl -n hw.model');
      const modelStr = model.toLowerCase().trim();

      const vmModels = ['vmware', 'parallels', 'virtualbox', 'qemu'];
      for (const vm of vmModels) {
        if (modelStr.includes(vm)) {
          this.vmSignals.push(`Hardware model contains "${vm}": ${modelStr}`);
          this.detectionMethods.push('hw_model');
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Check for VM processes
    const vmProcesses = ['vmware', 'VBoxService', 'parallels', 'qemu'];
    try {
      const { stdout: processes } = await execPromise('ps aux');
      const procList = processes.toLowerCase();

      for (const vmProc of vmProcesses) {
        if (procList.includes(vmProc.toLowerCase())) {
          this.vmSignals.push(`VM process detected: ${vmProc}`);
          this.detectionMethods.push('process_scan');
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Check CPU brand string
    try {
      const { stdout: cpu } = await execPromise('sysctl -n machdep.cpu.brand_string');
      const cpuBrand = cpu.toLowerCase().trim();

      if (cpuBrand.includes('qemu') || cpuBrand.includes('virtual')) {
        this.vmSignals.push(`CPU brand indicates VM: ${cpuBrand}`);
        this.detectionMethods.push('cpu_brand');
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Get human-readable VM type guess
   */
  getVMType() {
    const signals = this.vmSignals.join(' ').toLowerCase();

    if (signals.includes('vmware')) return 'VMware';
    if (signals.includes('virtualbox') || signals.includes('vbox')) return 'VirtualBox';
    if (signals.includes('qemu') || signals.includes('kvm')) return 'QEMU/KVM';
    if (signals.includes('xen')) return 'Xen';
    if (signals.includes('parallels')) return 'Parallels';
    if (signals.includes('hyper-v') || signals.includes('microsoft')) return 'Hyper-V';

    return this.isVM ? 'Unknown VM' : 'Physical Machine';
  }
}

// Singleton instance
const vmDetector = new VMDetector();

module.exports = vmDetector;
