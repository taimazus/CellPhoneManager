$c = @'
using System;
using System.Runtime.InteropServices;

public class WinInput {
    [StructLayout(LayoutKind.Sequential)]
    struct MOUSEINPUT {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct KEYBDINPUT {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Explicit)]
    struct INPUT_UNION {
        [FieldOffset(0)]
        public MOUSEINPUT mi;
        [FieldOffset(0)]
        public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct INPUT {
        public uint type;
        public INPUT_UNION u;
    }

    [DllImport("user32.dll", SetLastError = true)]
    static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    [DllImport("user32.dll")]
    static extern uint MapVirtualKey(uint uCode, uint uMapType);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);

    public const uint INPUT_KEYBOARD = 1;
    public const uint KEYEVENTF_KEYDOWN = 0x0000;
    public const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    public const uint KEYEVENTF_KEYUP = 0x0002;
    public const uint KEYEVENTF_SCANCODE = 0x0008;

    public static void KeyDown(byte vk) {
        ushort scan = (ushort)MapVirtualKey((uint)vk, 0);
        bool isExt = (vk >= 0x21 && vk <= 0x28) || vk == 0x2D || vk == 0x2E;

        // 1. Hardware DirectInput SendInput
        INPUT[] inputs = new INPUT[1];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].u.ki.wVk = (ushort)vk;
        inputs[0].u.ki.wScan = scan;
        inputs[0].u.ki.dwFlags = (isExt ? KEYEVENTF_EXTENDEDKEY : 0);
        inputs[0].u.ki.time = 0;
        inputs[0].u.ki.dwExtraInfo = IntPtr.Zero;
        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));

        // 2. Hardware keybd_event dual layer
        keybd_event(vk, (byte)scan, (isExt ? KEYEVENTF_EXTENDEDKEY : 0), UIntPtr.Zero);
    }

    public static void KeyUp(byte vk) {
        ushort scan = (ushort)MapVirtualKey((uint)vk, 0);
        bool isExt = (vk >= 0x21 && vk <= 0x28) || vk == 0x2D || vk == 0x2E;

        // 1. Hardware DirectInput SendInput
        INPUT[] inputs = new INPUT[1];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].u.ki.wVk = (ushort)vk;
        inputs[0].u.ki.wScan = scan;
        inputs[0].u.ki.dwFlags = KEYEVENTF_KEYUP | (isExt ? KEYEVENTF_EXTENDEDKEY : 0);
        inputs[0].u.ki.time = 0;
        inputs[0].u.ki.dwExtraInfo = IntPtr.Zero;
        SendInput(1, inputs, Marshal.SizeOf(typeof(INPUT)));

        // 2. Hardware keybd_event dual layer
        keybd_event(vk, (byte)scan, KEYEVENTF_KEYUP | (isExt ? KEYEVENTF_EXTENDEDKEY : 0), UIntPtr.Zero);
    }

    public static void KeyTap(byte vk) {
        KeyDown(vk);
        System.Threading.Thread.Sleep(45);
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
