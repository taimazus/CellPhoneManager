$source = @"
using System;
using System.Runtime.InteropServices;

public class WinInputBridge {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);

    public const uint KEYEVENTF_KEYDOWN = 0x0000;
    public const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static void KeyDown(byte vk, byte scan, bool isExt) {
        uint flags = KEYEVENTF_KEYDOWN | (isExt ? KEYEVENTF_EXTENDEDKEY : 0);
        keybd_event(vk, scan, flags, UIntPtr.Zero);
    }

    public static void KeyUp(byte vk, byte scan, bool isExt) {
        uint flags = KEYEVENTF_KEYUP | (isExt ? KEYEVENTF_EXTENDEDKEY : 0);
        keybd_event(vk, scan, flags, UIntPtr.Zero);
    }

    public static void KeyTap(byte vk, byte scan, bool isExt) {
        KeyDown(vk, scan, isExt);
        System.Threading.Thread.Sleep(50);
        KeyUp(vk, scan, isExt);
    }

    public static void MouseClick(string type) {
        if (type == "right") {
            mouse_event(0x0008, 0, 0, 0, UIntPtr.Zero);
            System.Threading.Thread.Sleep(15);
            mouse_event(0x0010, 0, 0, 0, UIntPtr.Zero);
        } else {
            mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);
            System.Threading.Thread.Sleep(15);
            mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
        }
    }

    public static void MouseMove(int dx, int dy) {
        mouse_event(0x0001, dx, dy, 0, UIntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $source

[Console]::Out.WriteLine("READY")
[Console]::Out.Flush()

while ($line = [Console]::In.ReadLine()) {
    if ($null -eq $line -or $line -eq "QUIT") { break }
    $line = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    try {
        if ($line.StartsWith("KEY_DOWN:")) {
            # Format: KEY_DOWN:vk,scan,isExt
            $parts = $line.Substring(9).Split(",")
            $vk = [byte]$parts[0]
            $scan = [byte]$parts[1]
            $isExt = [bool]::Parse($parts[2])
            [WinInputBridge]::KeyDown($vk, $scan, $isExt)
        } elseif ($line.StartsWith("KEY_UP:")) {
            $parts = $line.Substring(7).Split(",")
            $vk = [byte]$parts[0]
            $scan = [byte]$parts[1]
            $isExt = [bool]::Parse($parts[2])
            [WinInputBridge]::KeyUp($vk, $scan, $isExt)
        } elseif ($line.StartsWith("KEY_TAP:")) {
            $parts = $line.Substring(8).Split(",")
            $vk = [byte]$parts[0]
            $scan = [byte]$parts[1]
            $isExt = [bool]::Parse($parts[2])
            [WinInputBridge]::KeyTap($vk, $scan, $isExt)
        } elseif ($line.StartsWith("MOUSE:")) {
            $parts = $line.Substring(6).Split(",")
            if ($parts.Length -eq 2) {
                $dx = [int]$parts[0]
                $dy = [int]$parts[1]
                [WinInputBridge]::MouseMove($dx, $dy)
            }
        } elseif ($line.StartsWith("CLICK:")) {
            $type = $line.Substring(6)
            [WinInputBridge]::MouseClick($type)
        }
    } catch {
        # continue loop on error
    }
}
