using BAD.Generator.Configurations;
using BAD.JsonReader;
using Newtonsoft.Json.Linq;

namespace BAD.Presets.Mutations;

/// <summary>
/// Clase base abstracta para presets de mutación
/// </summary>
public abstract class BasePreset : IPreset
{
    public abstract string Name { get; }
    public abstract string Description { get; }
    public abstract PresetCategory Category { get; }

    public Dictionary<string, DefaultValueConfig> GenerateConfig(JObject jsonTemplate)
    {
        var configs = new Dictionary<string, DefaultValueConfig>();
        ProcessObject(jsonTemplate, "", configs);
        return configs;
    }

    /// <summary>
    /// Procesa recursivamente el objeto JSON
    /// </summary>
    protected void ProcessObject(JObject obj, string prefix, Dictionary<string, DefaultValueConfig> configs)
    {
        foreach (var property in obj.Properties())
        {
            string fullPath = string.IsNullOrEmpty(prefix) ? property.Name : $"{prefix}.{property.Name}";

            if (property.Value is JObject nestedObj)
            {
                ProcessObject(nestedObj, fullPath, configs);
            }
            else if (property.Value is JArray array && array.Count > 0 && array[0] is JObject)
            {
                // Para arrays de objetos, procesar el primer elemento como template
                ProcessObject((JObject)array[0], $"{fullPath}[0]", configs);
            }
            else
            {
                var valueType = Analyzer.GetType(property.Value);
                var config = CreateConfigForType(fullPath, valueType, property.Value);
                if (config != null)
                {
                    configs[fullPath] = config;
                }
            }
        }
    }

    /// <summary>
    /// Crea la configuración específica para cada tipo de campo
    /// Debe ser implementado por cada preset
    /// </summary>
    protected abstract DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue);
}
