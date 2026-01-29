using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets.Mutations;

/// <summary>
/// Preset que fuerza todos los valores a NULL
/// </summary>
public class AllNullPreset : BasePreset
{
    public override string Name => "Todo NULL";
    public override string Description => "Fuerza todos los valores a NULL";
    public override PresetCategory Category => PresetCategory.Basic;

    protected override DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue)
    {
        return new DefaultValueConfig
        {
            Operation = EnumOperations.ForceNull,
            TypeDefault = type
        };
    }
}
