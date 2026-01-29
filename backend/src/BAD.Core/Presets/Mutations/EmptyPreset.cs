using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets.Mutations;

/// <summary>
/// Preset que usa valores vacíos según el tipo
/// </summary>
public class EmptyPreset : BasePreset
{
    public override string Name => "Valores Vacíos";
    public override string Description => "Usa valores vacíos: string vacío, 0, false, etc.";
    public override PresetCategory Category => PresetCategory.Testing;

    protected override DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue)
    {
        return type switch
        {
            JTokenType.Integer => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Integer,
                Value = 0
            },

            JTokenType.Float => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Float,
                Value = 0.0f
            },

            JTokenType.String => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.String,
                Value = ""
            },

            JTokenType.Guid => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Guid,
                Value = Guid.Empty.ToString()
            },

            JTokenType.Boolean => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Boolean,
                Value = false
            },

            JTokenType.Date => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Date,
                Value = DateTime.MinValue.ToString("O")
            },

            _ => null
        };
    }
}
