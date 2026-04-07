' ============================================================================
' G360 DataMap VBA
' ============================================================================
' Funciones de mapeo de campos para VBA Excel
' ============================================================================

Option Explicit

' ============================================================================
' TIPOS
' ============================================================================

Public Type G360FieldMap
    LocalName As String
    StandardName As String
    DataType As String
End Type

' ============================================================================
' FUNCIONES DE MAPEO
' ============================================================================

Public Function G360_NormalizeFieldName(fieldName As String, dominio As String) As String
    Dim normalized As String
    normalized = LCase(Replace(Replace(fieldName, "_", ""), " ", ""))
    
    Select Case normalized
        Case "codigo", "sku", "cod", "producto", "item"
            G360_NormalizeFieldName = "codigo"
        Case "nombre", "descripcion", "producto", "nombreproducto"
            G360_NormalizeFieldName = "nombre"
        Case "cantidad", "cant", "qty", "stock"
            G360_NormalizeFieldName = "cantidad"
        Case "precio", "tarifa", "monto", "valor", "importe"
            G360_NormalizeFieldName = "precio"
        Case "fecha", "fec", "date"
            G360_NormalizeFieldName = "fecha"
        Case Else
            G360_NormalizeFieldName = fieldName
    End Select
End Function

Public Function G360_MapRow(rowData As Object, dominio As String) As Object
    ' Placeholder para mapeo de fila completa
    Set G360_MapRow = rowData
End Function
