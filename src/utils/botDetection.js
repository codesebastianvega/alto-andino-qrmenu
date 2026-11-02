/**
 * Bot & Crawler Detection Utility
 * Detects search engine bots, social media preview crawlers (Facebook/Meta,
 * Twitter, LinkedIn, WhatsApp, Telegram, etc.), and automated headless browsers.
 */

export const BOT_USER_AGENTS_REGEX = /facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|googlebot|bingbot|yandex|baidu|bytespider|applebot|duckduckbot|pinterest|headlesschrome|phantomjs|lighthouse|crawler|spider|bot/i;

/**
 * Checks if a user agent string belongs to an automated crawler or bot.
 * @param {string} userAgent
 * @returns {boolean}
 */
export const isBotUserAgent = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') return false;
  return BOT_USER_AGENTS_REGEX.test(userAgent);
};

/**
 * Detects if the current client environment is a bot or crawler.
 * @returns {boolean}
 */
export const isBot = () => {
  if (typeof window === 'undefined') return true;

  // 1. Check navigator.webdriver (set by Puppeteer, Selenium, headless browsers)
  if (typeof navigator !== 'undefined' && navigator.webdriver) {
    return true;
  }

  // 2. Check User-Agent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    if (isBotUserAgent(navigator.userAgent)) {
      return true;
    }
  }

  // 3. Headless Chrome / automation globals
  if (typeof window !== 'undefined' && (window._phantom || window.__nightmare || window.callPhantom)) {
    return true;
  }

  return false;
};
