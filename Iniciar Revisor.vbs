Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
objShell.CurrentDirectory = strPath

objShell.Run "cmd /c npm run dev > server.log 2>&1", 0, False

WScript.Sleep 10000

objShell.Run "http://localhost:3000"
