!macro customInit
  nsExec::Exec 'taskkill /F /IM SharedWingsX.exe /T'
  Sleep 1200
!macroend

!macro customInstall
  SetOverwrite on
!macroend
