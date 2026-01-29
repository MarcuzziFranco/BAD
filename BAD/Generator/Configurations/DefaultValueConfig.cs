using Newtonsoft.Json.Linq;

namespace BAD.Generator.Configurations;

public class DefaultValueConfig
{
    /// <summary>
    /// Tipo de token JSON esperado
    /// </summary>
    public JTokenType? TypeDefault { get; set; }

    /// <summary>
    /// Valor a usar (puede ser un valor fijo o un array para rotación)
    /// </summary>
    public dynamic? Value { get; set; }

    /// <summary>
    /// Operación a realizar con este campo
    /// </summary>
    public EnumOperations Operation { get; set; } = EnumOperations.Replace;

    /// <summary>
    /// Valor mínimo para rangos (números o fechas)
    /// </summary>
    public dynamic? MinValue { get; set; }

    /// <summary>
    /// Valor máximo para rangos (números o fechas)
    /// </summary>
    public dynamic? MaxValue { get; set; }

    /// <summary>
    /// Obtiene una descripción legible de la configuración
    /// </summary>
    public string GetDescription()
    {
        return Operation switch
        {
            EnumOperations.NotChange => "Sin cambios",
            EnumOperations.ForceNull => "Forzar NULL",
            EnumOperations.Replace when TypeDefault == JTokenType.Array => $"Lista rotativa ({((Array?)Value)?.Length ?? 0} valores)",
            EnumOperations.Replace => $"Valor fijo: {Value}",
            EnumOperations.RandomRange => $"Rango: {MinValue} - {MaxValue}",
            _ => Operation.ToString()
        };
    }
}
