using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets.Mutations;

/// <summary>
/// Preset que usa valores extremos
/// Strings muy largos, números muy grandes, etc.
/// </summary>
public class ExtremePreset : BasePreset
{
    public override string Name => "Valores Extremos";
    public override string Description => "Usa valores extremos: strings de 1000+ chars, números enormes, etc.";
    public override PresetCategory Category => PresetCategory.Testing;

    private static readonly string LongString = new string('A', 1000);
    private static readonly string VeryLongString = new string('X', 5000);
    private static readonly string LongStringWithSpaces = string.Join(" ", Enumerable.Repeat("palabra", 200));

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
                    int.MaxValue, 
                    int.MinValue, 
                    999999999,
                    -999999999,
                    2147483647,
                    -2147483648
                }
            },

            JTokenType.Float => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    float.MaxValue, 
                    float.MinValue, 
                    999999999.999999f,
                    -999999999.999999f,
                    0.000000001f,
                    -0.000000001f,
                    123456789.123456789f
                }
            },

            JTokenType.String => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new[] 
                { 
                    LongString, 
                    VeryLongString, 
                    LongStringWithSpaces,
                    new string('0', 500),
                    new string(' ', 100)
                }
            },

            JTokenType.Guid => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new[] 
                { 
                    "ffffffff-ffff-ffff-ffff-ffffffffffff",
                    "00000000-0000-0000-0000-000000000001",
                    Guid.NewGuid().ToString()
                }
            },

            JTokenType.Boolean => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] { true, false }
            },

            JTokenType.Date => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new[] 
                { 
                    "9999-12-31T23:59:59.9999999Z",
                    "0001-01-01T00:00:00.0000000Z",
                    DateTime.MaxValue.ToString("O"),
                    DateTime.MinValue.ToString("O")
                }
            },

            _ => null
        };
    }
}
