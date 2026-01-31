/**
 * MIME type mapping utility for common file types
 * Maps file extensions to their corresponding MIME types
 */

const MIME_TYPE_MAP: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',

  // Videos
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
  flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mpe: 'video/mpeg',
  mp2: 'video/mpeg',
  m2v: 'video/mpeg',
  ogv: 'video/ogg',

  // Audio
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  wav: 'audio/wav',
  weba: 'audio/webm',
  flac: 'audio/flac',
  wma: 'audio/x-ms-wma',
  mid: 'audio/midi',
  midi: 'audio/midi',

  // Documents – PDF & text
  pdf: 'application/pdf',
  txt: 'text/plain',
  text: 'text/plain',
  log: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
  xml: 'application/xml',
  rtf: 'application/rtf',

  // Office documents
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation',

  // Archives
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  bz2: 'application/x-bzip2',

  // Other common formats
  exe: 'application/x-msdownload',
  apk: 'application/vnd.android.package-archive',
  dmg: 'application/x-apple-diskimage',
  iso: 'application/x-iso9660-image',
};

/**
 * Converts a file path to its corresponding MIME type
 * @param filePath - The file path
 * @returns The corresponding MIME type, or 'application/octet-stream' as fallback
 */
export const getMimeTypeFromPath = (filePath: string | undefined): string => {
  if (!filePath) {
    return 'application/octet-stream';
  }

  // Extract extension from path and convert to lowercase
  const extension = filePath.split('.').pop()?.toLowerCase() || '';

  return MIME_TYPE_MAP[extension] || 'application/octet-stream';
};
