' Arranca Salud San Marcos en segundo plano, sin ninguna ventana visible.
' No requiere permisos de administrador. Se ubica automaticamente sin
' importar en que carpeta este el proyecto.

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverDir = scriptDir & "\server"

comando = "cmd /c cd /d """ & serverDir & """ && node --no-warnings dist\index.js"
WshShell.Run comando, 0, False
