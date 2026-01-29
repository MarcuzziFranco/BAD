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
}
