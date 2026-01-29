using BAD.Generator.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Presets.Mutations;

/// <summary>
/// Preset que mantiene todos los valores originales del JSON
/// </summary>
public class OriginalPreset : BasePreset
{
    public override string Name => "Original";
    public override string Description => "Mantiene todos los valores originales del JSON sin modificar";
    public override PresetCategory Category => PresetCategory.Basic;

    protected override DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue)
    {
        return new DefaultValueConfig
        {
            Operation = EnumOperations.NotChange,
            TypeDefault = type
        };
    }
}
