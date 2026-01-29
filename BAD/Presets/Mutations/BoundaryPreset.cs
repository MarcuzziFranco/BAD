using BAD.Generator.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Presets.Mutations;

/// <summary>
/// Preset que usa valores en los límites según el tipo
/// Útil para testing de edge cases
/// </summary>
public class BoundaryPreset : BasePreset
{
    public override string Name => "Valores Límite";
    public override string Description => "Usa valores en los límites: 0, -1, MAX, MIN, vacío, etc.";
    public override PresetCategory Category => PresetCategory.Testing;

    // Valores límite para rotar
    private static readonly int[] IntegerBoundaries = { 0, -1, 1, int.MaxValue, int.MinValue };
    private static readonly float[] FloatBoundaries = { 0f, -0f, 0.0001f, -0.0001f, float.MaxValue, float.MinValue };
    private static readonly string[] StringBoundaries = { "", " ", "  ", "\t", "\n", "\r\n" };
    private static readonly bool[] BooleanBoundaries = { true, false };

    protected override DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue)
    {
        return type switch
        {
            JTokenType.Integer => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = IntegerBoundaries.Cast<object>().ToArray()
            },

            JTokenType.Float => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = FloatBoundaries.Cast<object>().ToArray()
            },

            JTokenType.String => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = StringBoundaries
            },

            JTokenType.Guid => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new[] { Guid.Empty.ToString(), "00000000-0000-0000-0000-000000000000", Guid.NewGuid().ToString() }
            },

            JTokenType.Boolean => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = BooleanBoundaries.Cast<object>().ToArray()
            },

            JTokenType.Date => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new[] 
                { 
                    DateTime.MinValue.ToString("O"),
                    DateTime.MaxValue.ToString("O"),
                    "1970-01-01T00:00:00Z",
                    "1999-12-31T23:59:59Z",
                    "2000-01-01T00:00:00Z"
                }
            },

            _ => null
        };
    }
}
