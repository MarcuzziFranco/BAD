namespace BAD.Core.Generators;

/// <summary>
/// Interface base para generadores de valores aleatorios
/// </summary>
public interface IGenerator<T>
{
    /// <summary>
    /// Genera un valor aleatorio con configuración por defecto
    /// </summary>
    T Generate();

    /// <summary>
    /// Genera un valor aleatorio dentro de un rango específico
    /// </summary>
    T Generate(T min, T max);
}

/// <summary>
/// Interface para generadores que no requieren rangos (ej: boolean, UUID)
/// </summary>
public interface ISimpleGenerator<T>
{
    T Generate();
}
