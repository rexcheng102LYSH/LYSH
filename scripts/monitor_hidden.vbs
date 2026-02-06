Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Users\21518\Desktop\lysh\scripts\monitor.ps1""", 0, False 
