/**
 * 从 Bilibili URL 中提取 BV 号
 * 支持的 URL 格式：
 * - https://www.bilibili.com/video/BV1xx...
 * - https://b23.tv/xxxxx
 * - BV1xx... (直接 BV 号)
 */
export function extractBvid(url: string): string | null {
  if (!url) return null;

  // 去除首尾空格
  url = url.trim();

  // 直接 BV 号
  if (url.startsWith("BV")) {
    return url;
  }

  // 完整 URL
  try {
    const urlObj = new URL(url);

    // bilibili.com
    if (urlObj.hostname.includes("bilibili.com")) {
      const pathMatch = urlObj.pathname.match(/\/(BV\w+)/);
      if (pathMatch) {
        return pathMatch[1];
      }
    }

    // b23.tv 短链接需要重定向获取真实链接
    if (urlObj.hostname.includes("b23.tv")) {
      // 短链接无法直接解析，需要服务端处理
      console.warn("b23.tv 短链接暂不支持，请使用完整链接");
      return null;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * 验证 BV 号格式
 */
export function isValidBvid(bvid: string): boolean {
  return /^BV[a-zA-Z0-9]{10}$/.test(bvid);
}
