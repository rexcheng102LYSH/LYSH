Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
baseDir = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "cmd /c """ & baseDir & "\start-git-stash.bat""", 0, False
