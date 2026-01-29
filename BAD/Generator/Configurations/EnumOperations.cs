namespace BAD.Generator.Configurations;

public enum EnumOperations
{
    /// <summary>
    /// No modificar el valor original
    /// </summary>
    NotChange = 0,

    /// <summary>
    /// Reemplazar con un valor fijo o lista de valores
    /// </summary>
    Replace = 1,

    /// <summary>
    /// Forzar el valor a NULL
    /// </summary>
    ForceNull = 2,

    /// <summary>
    /// Generar valor aleatorio dentro de un rango específico (para números y fechas)
    /// </summary>
    RandomRange = 3,
}
