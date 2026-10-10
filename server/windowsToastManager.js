import { exec } from 'child_process';

export class WindowsToastManager {
  constructor() {
    this.enabled = true;
    this.lastToastTime = 0;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
  }

  isEnabled() {
    return this.enabled;
  }

  showToast(title, message) {
    if (!this.enabled) return;
    
    // Throttle to at most once every 1.2 seconds to avoid PowerShell spam
    const now = Date.now();
    if (now - this.lastToastTime < 1200) {
      return;
    }
    this.lastToastTime = now;

    try {
      const cleanTitle = (title || 'CellPhoneManager')
        .replace(/'/g, "''")
        .replace(/[\r\n]+/g, ' ')
        .substring(0, 100);

      const cleanMessage = (message || '')
        .replace(/'/g, "''")
        .replace(/[\r\n]+/g, ' ')
        .substring(0, 180);

      const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$texts = $template.GetElementsByTagName('text')
$texts.Item(0).AppendChild($template.CreateTextNode('${cleanTitle}')) | Out-Null
$texts.Item(1).AppendChild($template.CreateTextNode('${cleanMessage}')) | Out-Null
$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('CellPhoneManager')
$notifier.Show($toast)
`;

      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const cmd = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;

      exec(cmd, (err) => {
        if (err) {
          // Log explicitly as per Constitution Rule 2
          console.warn('[WindowsToastManager] Toast notification dispatch notice:', err.message);
        }
      });
    } catch (err) {
      console.warn('[WindowsToastManager] showToast error:', err.message);
    }
  }
}

export const windowsToastManager = new WindowsToastManager();
