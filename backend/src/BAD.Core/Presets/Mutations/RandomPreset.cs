using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets.Mutations;

/// <summary>
/// Preset que genera valores aleatorios para todos los campos
/// (comportamiento por defecto del generador)
/// </summary>
public class RandomPreset : BasePreset
{
    public override string Name => "Aleatorio";
    public override string Description => "Genera valores aleatorios para todos los campos según su tipo";
    public override PresetCategory Category => PresetCategory.Basic;

    protected override DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue)
    {
        return null;
    }
}
