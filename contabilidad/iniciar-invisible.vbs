' Arranca Sumivensa en segundo plano, sin ninguna ventana visible.
' No requiere permisos de administrador. Se ubica automaticamente sin
' importar en que carpeta este el proyecto.

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverDir = scriptDir & "\server"

' La salida (y cualquier error de arranque) queda guardada en server\arranque.log,
' ya que al correr sin ventana (estilo 0) no hay otra forma de ver que fallo si
' el sistema no llega a abrir.
comando = "cmd /c cd /d """ & serverDir & """ && node --no-warnings dist\index.js > arranque.log 2>&1"
WshShell.Run comando, 0, False
