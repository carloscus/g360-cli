Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

strCurrentPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
strDesktop = objShell.SpecialFolders("Desktop")
strBatPath = strCurrentPath & "\run.bat"
strIconPath = strCurrentPath & "\assets\images\app.ico"

If objFSO.FileExists(strDesktop & "\G360 App.lnk") Then
    objFSO.DeleteFile strDesktop & "\G360 App.lnk", True
End If

Set objShortcut = objShell.CreateShortcut(strDesktop & "\G360 App.lnk")
objShortcut.TargetPath = strBatPath
objShortcut.WorkingDirectory = strCurrentPath
objShortcut.Description = "G360 Flet App - powered by G360"
objShortcut.WindowStyle = 7

If objFSO.FileExists(strIconPath) Then
    objShortcut.IconLocation = strIconPath & ", 0"
Else
    objShortcut.IconLocation = "%SystemRoot%\system32\shell32.dll, 15"
End If

objShortcut.Save

objShell.Run "ie4uinit.exe -show", 0, True
