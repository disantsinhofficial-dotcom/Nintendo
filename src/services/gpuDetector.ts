import { GpuDriver } from '../types/emulator';

export interface DetectedGpuInfo {
  renderer: string;
  vendor: string;
  webglVersion: string;
  maxTextureSize: number;
  anisotropicFiltering: boolean;
  maxAnisotropy: number;
  vulkanApiSupported: boolean;
  vulkanVersion: string;
  openGlEsVersion: string;
  deviceArchitecture: 'Adreno' | 'Mali' | 'Apple' | 'Nvidia' | 'Intel' | 'Generic';
  recommendedDriverId: string;
}

export function detectGpuCapabilities(): DetectedGpuInfo {
  let renderer = 'Standard Mobile GPU';
  let vendor = 'Generic';
  let webglVersion = 'WebGL 2.0 (OpenGL ES 3.0)';
  let maxTextureSize = 8192;
  let anisotropicFiltering = false;
  let maxAnisotropy = 1;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      webglVersion = gl.getParameter(gl.VERSION) || webglVersion;
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 8192;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
      }

      const extAniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                       gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      if (extAniso) {
        anisotropicFiltering = true;
        maxAnisotropy = gl.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 16;
      }
    }
  } catch (e) {
    console.warn('WebGL detection error:', e);
  }

  // Determine architecture from renderer string
  const rLower = (renderer + ' ' + vendor).toLowerCase();
  let deviceArchitecture: DetectedGpuInfo['deviceArchitecture'] = 'Generic';
  let vulkanApiSupported = true;
  let vulkanVersion = 'Vulkan 1.3.268';
  let openGlEsVersion = 'OpenGL ES 3.2';
  let recommendedDriverId = 'drv_system_default';

  if (rLower.includes('adreno') || rLower.includes('qualcomm')) {
    deviceArchitecture = 'Adreno';
    vulkanVersion = 'Vulkan 1.3 (Adreno Turnip / KGSL)';
    recommendedDriverId = 'drv_turnip_24_3';
  } else if (rLower.includes('mali') || rLower.includes('arm')) {
    deviceArchitecture = 'Mali';
    vulkanVersion = 'Vulkan 1.3 (Bifrost / Valhall)';
    recommendedDriverId = 'drv_mali_system';
  } else if (rLower.includes('apple') || rLower.includes('metal')) {
    deviceArchitecture = 'Apple';
    vulkanVersion = 'MoltenVK / Vulkan 1.2';
    recommendedDriverId = 'drv_system_default';
  } else if (rLower.includes('nvidia') || rLower.includes('geforce') || rLower.includes('tegra')) {
    deviceArchitecture = 'Nvidia';
    vulkanVersion = 'Vulkan 1.3.280';
    recommendedDriverId = 'drv_system_default';
  } else if (rLower.includes('intel')) {
    deviceArchitecture = 'Intel';
    vulkanVersion = 'Vulkan 1.3 (ANV)';
    recommendedDriverId = 'drv_system_default';
  }

  return {
    renderer,
    vendor,
    webglVersion,
    maxTextureSize,
    anisotropicFiltering,
    maxAnisotropy,
    vulkanApiSupported,
    vulkanVersion,
    openGlEsVersion,
    deviceArchitecture,
    recommendedDriverId,
  };
}

export const INITIAL_GPU_DRIVERS: GpuDriver[] = [
  {
    id: 'drv_system_default',
    name: 'Android System Default Driver',
    version: 'OS Stock v512.782.0',
    vendor: 'OEM / Android 13 BSP',
    type: 'system',
    vulkanApiVersion: '1.3.243',
    openglVersion: 'OpenGL ES 3.2 v1@512.0',
    stability: 'High',
    recommended: false,
    description: 'Default vendor-supplied GPU driver included with your ColorOS/Android 13 firmware.',
    packageSize: 'Built-in (ROM)',
  },
  {
    id: 'drv_turnip_24_3',
    name: 'Mesa Turnip + Zink Vulkan Driver',
    version: 'v24.3.0 - Revision 9',
    vendor: 'Mesa Freedreno Community',
    type: 'turnip',
    vulkanApiVersion: '1.3.279 (VK_KHR_shader_float16_int8)',
    openglVersion: 'OpenGL ES 3.2 Mesa 24.3',
    stability: 'High',
    recommended: true,
    description: 'High performance open-source user-space Vulkan driver for Adreno 6xx/7xx. Drastically reduces shader stutter in Dolphin core.',
    packageSize: '14.8 MB',
  },
  {
    id: 'drv_adreno_v676',
    name: 'Qualcomm Adreno Proprietary Driver',
    version: 'v0676.54.0 - Snapdragon Gen 2/3',
    vendor: 'Qualcomm Technologies Inc.',
    type: 'adreno_prop',
    vulkanApiVersion: '1.3.268',
    openglVersion: 'OpenGL ES 3.2 V@0676.54',
    stability: 'High',
    recommended: false,
    description: 'Official Qualcomm proprietary driver with fast instruction pipeline for Snapdragon flagship processors.',
    packageSize: '22.4 MB',
  },
  {
    id: 'drv_turnip_bleeding',
    name: 'Turnip Experimental CI Build',
    version: 'Git-Commit-7f30a9e',
    vendor: 'Freedreno Team',
    type: 'turnip',
    vulkanApiVersion: '1.3.284 (VK_EXT_extended_dynamic_state3)',
    openglVersion: 'OpenGL ES 3.2 Dev',
    stability: 'Experimental',
    recommended: false,
    description: 'Cutting-edge driver with experimental sparse memory binding and Ubershader pipeline optimizations.',
    packageSize: '16.2 MB',
  },
];
