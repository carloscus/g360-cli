' ============================================================================
' MODULO: Module_Main.bas
' ============================================================================
' DESCRIPCIÓN:
'    Módulo principal para macros VBA de G360
'
' @dependencias: g360-datamap.bas
' @autor: Carlos Cusi
' @fecha: 2026-04-07
' ============================================================================

Option Explicit

' ============================================================================
' CONSTANTES G360
' ============================================================================

Public Const G360_VERSION As String = "1.0.0"
Public Const G360_AUTHOR As String = "Carlos Cusi"

' ============================================================================
' FUNCIONES PRINCIPALES
' ============================================================================

Public Function G360_GetVersion() As String
    G360_GetVersion = G360_VERSION
End Function

Public Sub G360_ShowInfo()
    MsgBox "G360 VBA Module v" & G360_VERSION & vbCrLf & _
           "Autor: " & G360_AUTHOR & vbCrLf & vbCrLf & _
           "Herramientas para automatización con G360 Ecosystem", _
           vbInformation, "G360 Info"
End Sub
