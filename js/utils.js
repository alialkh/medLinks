// Utility helpers
export function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch (e) {
    return url;
  }
}

export function getFaviconUrl(url, size = 64) {
  const domain = getDomain(url);
  // Google favicon service (fast, wide support)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

// darken or lighten hex color by amount (-100..100)
export function adjustColor(hex, amount) {
  try {
    let col = hex.replace('#', '');
    if (col.length === 3) col = col.split('').map(c => c + c).join('');
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  } catch (e) {
    return hex;
  }
}

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.keys(props).forEach(k => {
    if (k === 'class') node.className = props[k];
    else if (k === 'html') node.innerHTML = props[k];
    else node.setAttribute(k, props[k]);
  });
  children.flat().forEach(c => {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c instanceof Node) node.appendChild(c);
  });
  return node;
}
