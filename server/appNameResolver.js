/**
 * appNameResolver.js
 * Intelligent Package Name & Display Label Resolver for CellPhoneManager
 * 
 * Maps Android package identifiers to accurate, human-readable Iranian & Global application names.
 * Falls back to an advanced heuristic parser to eliminate generic "android" or "app" labels.
 * 
 * Developed by Sahand Electronic Solutions Co. (https://irres.ir)
 */

export const KNOWN_APP_NAMES = {
  // --- Iranian Banks & Financial Apps ---
  'com.refahbank.dpi.android': 'بانک رفاه کارگران (Refah Bank)',
  'ir.tejaratbank.totp.mobile.android': 'رمزبان بانک تجارت (Tejarat TOTP)',
  'ir.tejaratbank.tata.mobile.android.tejarat': 'همراه بانک تجارت (Tejarat Bank)',
  'ir.bmi.bam.nativeweb': 'بام بانک ملی (BMI Bam)',
  'ir.refahotp.refahotp': 'رمزساز رفاه (Refah OTP)',
  'com.ada.mbank.parsian': 'همراه بانک پارسیان (Parsian Bank)',
  'com.tara360.tara.production': 'تارا ۳۶۰ (Tara)',
  'com.emofid.rnmofid': 'مفید آنلاین (Mofid)',
  'ir.easytrader.orbis.m.twa': 'ایزی‌تریدر مفید (EasyTrader)',
  'ir.partsoftware.cup': 'سیبانک (CBank)',
  'market.nobitex': 'نوبیتکس (Nobitex)',
  'ir.ayantech.ghabzino': 'قبضینو (Ghabzino)',
  'ir.ayantech.pishkhan24': 'پیشخوان ۲۴ (Pishkhan 24)',
  'ir.gov.tax.MyTax': 'مالیات من (MyTax)',
  'ir.we.tax': 'سامانه مالیات (Tax)',
  'ir.mobillet.app': 'موبیلت سامان (Mobillet)',
  'mob.banking.android.resalat': 'همراه بانک رسالت (Resalat Bank)',
  'nuesoft.mobileToken': 'توکن همراه (Mobile Token)',
  'com.ton_keeper': 'کیف‌پول تون‌کیپر (Tonkeeper)',
  'net.metaquotes.metatrader5': 'متاتریدر ۵ (MetaTrader 5)',

  // --- VPN & Networking & Tech Tools ---
  'com.wireguard.android': 'WireGuard (وایرگارد)',
  'com.v2ray.ang': 'v2rayNG',
  'dev.hexasoftware.v2box': 'V2Box (وی‌توباکس)',
  'net.openvpn.openvpn': 'OpenVPN Connect',
  'com.pdanet': 'PdaNet+ (اشتراک اینترنت)',
  'com.anydesk.anydeskandroid': 'AnyDesk (انی‌دسک)',
  'com.microsoft.rdc.android': 'مایکروسافت ریموت دسکتاپ (Microsoft Remote Desktop RDC)',
  'ru.iiec.pydroid3': 'محیط پایتون (Pydroid 3)',
  'com.github.android': 'گیت‌هاب (GitHub)',
  'ai.perplexity.app.android': 'هوش مصنوعی پرپلکسیتی (Perplexity AI)',
  'com.linkedin.android': 'لینکدین (LinkedIn)',
  'com.xing.android': 'XING (شبکه کاری)',
  'com.dsi.ant.plugins.antplus': 'سرویس ANT+ Plugins',
  'com.ichi2.anki': 'فلش‌کارت آنکی (AnkiDroid)',
  'com.kamal.androidtv': 'اندروید تی‌وی (Android TV)',
  'jp.co.canon.android.printservice.plugin': 'پلاگین پرینتر کانن (Canon Print)',
  'jp.co.canon.bsd.ad.pixmaprint': 'چاپگر عکس کانن (Canon Pixma)',

  // --- Entertainment, Music & Tools ---
  'net.melodify.android': 'ملودیفای (Melodify)',
  'com.ovelin.guitartuna': 'تیونر گیتار (GuitarTuna)',
  'net.telewebion': 'تلوبیون (Telewebion)',
  'app.salintv.com': 'سالین تی‌وی (Salin TV)',
  'com.sololearn': 'سولولرن (SoloLearn)',
  'org.wikipedia': 'ویکی‌پدیا (Wikipedia)',
  'com.farnood.hafezfall': 'فال حافظ (Hafez)',
  'org.crcis.quran': 'قرآن کریم (Quran)',
  'org.crcis.mafatih': 'مفاتیح الجنان (Mafatih)',
  'org.crcis.noorhadith': 'نورالحدیث (Noor Hadith)',
  'org.crcis.shahname': 'شاهنامه فردوسی (Shahnameh)',
  'org.crcis.hafiz': 'دیوان حافظ (Hafiz)',
  'ir.iribradio.iranseda3': 'ایران‌صدا (IranSeda)',
  'com.sayhi.android.sayhitranslate': 'مترجم صوتی (SayHi Translate)',
  'com.live.flighttracker': 'ردیاب پروازها (Flight Tracker)',

  // --- Social & Messaging ---
  'org.telegram.messenger': 'تلگرام (Telegram)',
  'com.whatsapp': 'واتساپ (WhatsApp)',
  'com.whatsapp.w4b': 'واتساپ تجاری (WhatsApp Business)',
  'com.instagram.android': 'اینستاگرام (Instagram)',
  'ir.eitaa.messenger': 'ایتا (Eitaa)',
  'app.rbmain.a': 'روبیکا (Rubika)',
  'ir.ble.messenger': 'بله (Bale)',
  'mobi.mmdt.ottplus': 'سروش پلاس (Soroush+)',
  'net.iGap': 'آی‌گپ (iGap)',
  'ir.nasim': 'نسیم (Nasim)',
  'cx.ring': 'جامی (Jami)',

  // --- Transportation & Travel & Shopping ---
  'cab.snapp.passenger': 'اسنپ (Snapp)',
  'taxi.tap30.passenger': 'تپسی (Tapsi)',
  'ir.divar': 'دیوار (Divar)',
  'ir.torob': 'ترب (Torob)',
  'com.digikala': 'دیجی‌کالا (Digikala)',
  'ir.alibaba': 'علی‌بابا (Alibaba)',
  'ir.flytoday': 'فلای‌تودی (FlyToday)',
  'org.rajman.neshan.traffic.tehran.navigator': 'مسیریاب نشان (Neshan)',
  'com.zharfa.boof_android_app': 'بوف (Boof App)',
  'ir.sharif.drive': 'درایو شریف (Sharif Drive)',

  // --- Telecom & Operator Apps ---
  'ir.mci.ecareapp': 'همراه من (Hamrah Man - MCI)',
  'com.myirancell': 'ایرانسل من (MyIrancell)',
  'ir.rightel.myrightel': 'رایتل من (MyRightel)',
  'ir.asiatech.tmk': 'آسیاتک (Asiatech)',
  'ir.mservices.market': 'مایکت (Myket)',
  'ir.gov.mygov': 'دولت همراه من (MyGov)',
  'ir.hami.gov': 'سامانه حامی (Hami)',

  // --- Browsers & Productivity ---
  'com.android.chrome': 'گوگل کروم (Google Chrome)',
  'org.mozilla.firefox': 'موزیلا فایرفاکس (Firefox)',
  'com.microsoft.emmx': 'مایکروسافت اج (Microsoft Edge)',
  'com.microsoft.translator': 'مترجم مایکروسافت (Translator)',
  'org.torproject.torbrowser': 'مرورگر تور (Tor Browser)',
  'cn.wps.xiaomi.abroad.lite': 'آفیس WPS (WPS Office)',
  'com.google.android.apps.googlevoice': 'گوگل ویس (Google Voice)',
  'com.google.android.apps.dynamite': 'گوگل چت (Google Chat)',
  'com.google.android.apps.nbu.files': 'فایل‌های گوگل (Files by Google)',

  // --- System, Xiaomi, Google Core ---
  'android': 'سیستم‌عامل اندروید (Android System)',
  'com.android.systemui': 'رابط کاربری سیستم (System UI)',
  'com.miui.securitycenter': 'امنیت شیائومی (Security)',
  'com.miui.screenrecorder': 'ضبط صفحه شیائومی (Screen Recorder)',
  'com.miui.calculator': 'ماشین‌حساب (Calculator)',
  'com.miui.compass': 'قطب‌نما (Compass)',
  'com.miui.bugreport': 'گزارش خطای شیائومی (Bug Report)',
  'com.miui.micloudsync': 'همگام‌سازی ابری شیائومی (Mi Cloud)',
  'com.miui.backup': 'پشتیبان‌گیری شیائومی (Mi Backup)',
  'com.android.camera': 'دوربین گوشی (Camera)',
  'com.android.soundrecorder': 'ضبط صدای گوشی (Recorder)',
  'com.android.settings': 'تنظیمات گوشی (Settings)',
  'com.android.vending': 'گوگل پلی استور (Google Play Store)',
  'com.google.android.gms': 'خدمات گوگل پلی (Google Play Services)',
  'com.google.android.googlequicksearchbox': 'جستجوی گوگل (Google Search)',
  'com.google.android.youtube': 'یوتیوب (YouTube)',
  'com.google.android.gm': 'جیمیل (Gmail)',
  'com.google.android.apps.maps': 'گوگل مپ (Google Maps)'
};

const GENERIC_SUFFIXES = new Set([
  'android', 'mobile', 'app', 'apps', 'client', 'prod', 'production', 
  'release', 'debug', 'lite', 'pro', 'free', 'full', 'global', 
  'official', 'main', 'service', 'services', 'plugin', 'plugins', 
  'dpi', 'ui', 'phone', 'tab', 'tablet', 'tv', 'gms', 'gsf', 
  'wear', 'core', 'base', 'native', 'impl', 'presentation', 
  'activity', 'activities', 'view', 'totp', 'otp'
]);

const DOMAIN_SEGMENTS = new Set([
  'com', 'org', 'net', 'ir', 'ai', 'io', 'co', 'app', 'dev', 'me', 
  'ru', 'cn', 'de', 'uk', 'us', 'md', 'fr', 'it', 'es', 'jp', 'kr', 
  'in', 'ca', 'au', 'ch', 'se', 'nl', 'eu', 'biz', 'info'
]);

/**
 * Intelligently parse a package name into a clean, human-readable display name
 */
export function resolveAppDisplayName(packageName) {
  if (!packageName || typeof packageName !== 'string') {
    return 'برنامه نامشخص';
  }

  const trimmed = packageName.trim();

  // 1. Direct dictionary match
  if (KNOWN_APP_NAMES[trimmed]) {
    return KNOWN_APP_NAMES[trimmed];
  }

  // Handle special case for root android
  if (trimmed === 'android') {
    return 'سیستم‌عامل اندروید (Android System)';
  }

  // 2. Tokenize package name
  const parts = trimmed.split('.').filter(Boolean);
  if (parts.length === 1) {
    return formatNameToken(parts[0]);
  }

  // 3. Filter out domain tokens
  const nonDomainParts = parts.filter(p => !DOMAIN_SEGMENTS.has(p.toLowerCase()));

  // 4. Find the most descriptive non-generic token from the remaining parts
  // Look backwards from the end for the first meaningful brand token
  let candidateTokens = [];
  for (let i = nonDomainParts.length - 1; i >= 0; i--) {
    const p = nonDomainParts[i].toLowerCase();
    if (!GENERIC_SUFFIXES.has(p)) {
      candidateTokens.unshift(nonDomainParts[i]);
      // If we find a strong brand token, optionally also take the preceding token if it's descriptive
      if (i > 0 && !DOMAIN_SEGMENTS.has(nonDomainParts[i - 1].toLowerCase()) && !GENERIC_SUFFIXES.has(nonDomainParts[i - 1].toLowerCase())) {
        candidateTokens.unshift(nonDomainParts[i - 1]);
      }
      break;
    }
  }

  // 5. Fallback if all tokens were considered generic
  if (candidateTokens.length === 0) {
    // Take the last non-domain token, or the very last token
    const fallbackToken = nonDomainParts[nonDomainParts.length - 1] || parts[parts.length - 1];
    candidateTokens = [fallbackToken];
  }

  // 6. Format and join tokens into a clean title
  const formatted = candidateTokens
    .map(t => formatNameToken(t))
    .filter(Boolean)
    .join(' ');

  return formatted || trimmed;
}

/**
 * Format a single token: split camelCase, underscores, numbers, and capitalize words
 */
function formatNameToken(token) {
  if (!token) return '';

  // Handle known common brand acronyms or full names
  const lower = token.toLowerCase();
  const BRAND_MAP = {
    'wireguard': 'WireGuard',
    'linkedin': 'LinkedIn',
    'perplexity': 'Perplexity',
    'github': 'GitHub',
    'melodify': 'Melodify',
    'xing': 'XING',
    'rdc': 'RDC Remote Desktop',
    'v2ray': 'v2rayNG',
    'v2box': 'V2Box',
    'ang': 'v2rayNG',
    'anydesk': 'AnyDesk',
    'anydeskandroid': 'AnyDesk',
    'antplus': 'ANT+ Plugins',
    'anki': 'AnkiDroid',
    'refahbank': 'بانک رفاه (Refah Bank)',
    'tejaratbank': 'بانک تجارت (Tejarat Bank)',
    'divar': 'دیوار (Divar)',
    'torob': 'ترب (Torob)',
    'nobitex': 'نوبیتکس (Nobitex)',
    'snapp': 'اسنپ (Snapp)',
    'tapsi': 'تپسی (Tapsi)',
    'tap30': 'تپسی (Tapsi)',
    'eitaa': 'ایتا (Eitaa)',
    'rubika': 'روبیکا (Rubika)',
    'bale': 'بله (Bale)',
    'soroush': 'سروش (Soroush)',
    'myirancell': 'ایرانسل من (MyIrancell)',
    'ecareapp': 'همراه من (Hamrah Man)',
    'bam': 'بام بانک ملی (BMI Bam)',
    'telewebion': 'تلوبیون (Telewebion)',
    'digikala': 'دیجی‌کالا (Digikala)',
    'salintv': 'سالین تی‌وی (Salin TV)',
    'guitartuna': 'GuitarTuna',
    'tonkeeper': 'Tonkeeper'
  };

  if (BRAND_MAP[lower]) {
    return BRAND_MAP[lower];
  }

  // Split camelCase (e.g. "anyDeskAndroid" -> "any Desk Android")
  let s = token.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Replace underscores and dashes with spaces
  s = s.replace(/[-_]+/g, ' ');

  // Separate digits from letters if attached (e.g. "v2box" -> "V2 Box")
  s = s.replace(/([a-zA-Z])(\d+)/g, '$1 $2');

  // Capitalize each word
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const wLower = word.toLowerCase();
      // Keep acronyms uppercase
      if (['vpn', 'tv', 'rdc', 'sms', 'otp', 'totp', 'id', 'ai', 'apk', 'ui', 'hd', 'pc'].includes(wLower)) {
        return wLower.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
