using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets.Mutations;

/// <summary>
/// Preset que pone tipos incorrectos en cada campo
/// Para testing de validación de tipos
/// </summary>
public class InvalidTypesPreset : BasePreset
{
    public override string Name => "Tipos Inválidos";
    public override string Description => "Pone tipos incorrectos: string donde va int, número donde va bool, etc.";
    public override PresetCategory Category => PresetCategory.Security;

    protected override DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue)
    {
        return type switch
        {
            JTokenType.Integer => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    "no soy un número",
                    "123abc",
                    "NaN",
                    "undefined",
                    "null",
                    "true",
                    "1.5",
                    "",
                    " "
                }
            },

            JTokenType.Float => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    "no soy decimal",
                    "12.34.56",
                    "1,234.56",
                    "NaN",
                    "Infinity",
                    "-Infinity",
                    "1e999999",
                    ""
                }
            },

            JTokenType.String => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    12345,
                    true,
                    false,
                    0,
                    -1,
                    3.14159f
                }
            },

            JTokenType.Guid => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    "no-soy-un-guid",
                    "12345",
                    "ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ",
                    "00000000-0000-0000-0000",
                    "",
                    12345,
                    true
                }
            },

            JTokenType.Boolean => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    "true",
                    "false",
                    "yes",
                    "no",
                    "1",
                    "0",
                    2,
                    -1,
                    "verdadero"
                }
            },

            JTokenType.Date => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    "no soy una fecha",
                    "32/13/2024",
                    "2024-13-32",
                    "fecha",
                    12345,
                    true,
                    "",
                    "2024-02-30"
                }
            },

            _ => null
        };
    }
}
