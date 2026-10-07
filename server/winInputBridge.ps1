$c = @'
using System;
using System.Runtime.InteropServices;

public class WinInput {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern uint MapVirtualKey(uint uCode, uint uMapType);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);

    public const uint KEYEVENTF_KEYDOWN = 0x0000;
    public const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static void KeyDown(byte vk) {
        byte scan = (byte)MapVirtualKey((uint)vk, 0);
        uint flags = KEYEVENTF_KEYDOWN;
        if (vk >= 0x21 && vk <= 0x28) {
            flags |= KEYEVENTF_EXTENDEDKEY;
        }
        keybd_event(vk, scan, flags, UIntPtr.Zero);
    }

    public static void KeyUp(byte vk) {
        byte scan = (byte)MapVirtualKey((uint)vk, 0);
        uint flags = KEYEVENTF_KEYUP;
        if (vk >= 0x21 && vk <= 0x28) {
            flags |= KEYEVENTF_EXTENDEDKEY;
        }
        keybd_event(vk, scan, flags, UIntPtr.Zero);
    }

    public static void KeyTap(byte vk) {
        KeyDown(vk);
        System.Threading.Thread.Sleep(50);
        KeyUp(vk);
    }

    public static void MouseClick(string type) {
        if (type == "right") {
            mouse_event(0x0008, 0, 0, 0, UIntPtr.Zero);
            System.Threading.Thread.Sleep(10);
            mouse_event(0x0010, 0, 0, 0, UIntPtr.Zero);
        } else {
            mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);
            System.Threading.Thread.Sleep(10);
            mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
        }
    }

    public static void MouseMove(int dx, int dy) {
        mouse_event(0x0001, dx, dy, 0, UIntPtr.Zero);
    }
}
'@

Add-Type -TypeDefinition $c

[Console]::Out.WriteLine("READY")
[Console]::Out.Flush()

while ($line = [Console]::In.ReadLine()) {
    if ($null -eq $line -or $line -eq "QUIT") { break }
    $line = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    try {
        if ($line.StartsWith("TAP:")) {
            $vk = [byte]($line.Substring(4))
            [WinInput]::KeyTap($vk)
        } elseif ($line.StartsWith("DOWN:")) {
            $vk = [byte]($line.Substring(5))
            [WinInput]::KeyDown($vk)
        } elseif ($line.StartsWith("UP:")) {
            $vk = [byte]($line.Substring(3))
            [WinInput]::KeyUp($vk)
        } elseif ($line.StartsWith("MOUSE:")) {
            $parts = $line.Substring(6).Split(",")
            if ($parts.Length -eq 2) {
                $dx = [int]$parts[0]
                $dy = [int]$parts[1]
                [WinInput]::MouseMove($dx, $dy)
            }
        } elseif ($line.StartsWith("CLICK:")) {
            $type = $line.Substring(6)
            [WinInput]::MouseClick($type)
        }
    } catch {
        # continue loop on error
    }
}
