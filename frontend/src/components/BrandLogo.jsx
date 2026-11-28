import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const DEFAULT_DARK_LOGO_URLS = new Set([
  '/technomold-logo.png',
  '/technomold-logo-dark.png',
  '/technomold-logo-transparent.png',
  '/technomold-sidebar-transparent.png',
]);

/**
 * Renders the Technomold logo appropriate for the current theme (dark vs light),
 * or a custom uploaded tenant logo when provided.
 */
export function BrandLogo({
  customSrc = null,
  alt = 'Technomold IT Solutions Pvt Ltd',
  className = 'block w-full max-w-[210px] h-auto object-contain',
  style,
}) {
  const { isLight } = useTheme();

  const isCustomUpload =
    Boolean(customSrc) &&
    !DEFAULT_DARK_LOGO_URLS.has(customSrc) &&
    customSrc !== '/technomold-logo-light.png' &&
    !String(customSrc).includes('technomold-logo');

  if (isCustomUpload) {
    return <img src={customSrc} alt={alt} className={className} style={style} />;
  }

  return (
    <img
      src={isLight ? '/technomold-logo-light.png' : '/technomold-logo-dark.png'}
      alt={alt}
      className={className}
      style={style}
    />
  );
}

export default BrandLogo;
