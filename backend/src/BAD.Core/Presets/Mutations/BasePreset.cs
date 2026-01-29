using BAD.Core.Analysis;
using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Presets.Mutations;

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
            else if (property.Value is JArray array)
            {
                ProcessArray(array, fullPath, configs);
            }
            else
            {
                var valueType = JsonAnalyzer.GetType(property.Value);
                var config = CreateConfigForType(fullPath, valueType, property.Value);
                if (config != null)
                {
                    configs[fullPath] = config;
                }
            }
        }
    }

    /// <summary>
    /// Procesa un array JSON (de objetos o de valores primitivos)
    /// </summary>
    protected void ProcessArray(JArray array, string prefix, Dictionary<string, DefaultValueConfig> configs)
    {
        if (array.Count == 0) return;

        var firstElement = array[0];

        if (firstElement is JObject firstObj)
        {
            ProcessObject(firstObj, $"{prefix}[0]", configs);
        }
        else if (firstElement is JArray nestedArray)
        {
            ProcessArray(nestedArray, $"{prefix}[0]", configs);
        }
        else
        {
            var valueType = JsonAnalyzer.GetType(firstElement);
            var config = CreateConfigForType($"{prefix}[0]", valueType, firstElement);
            if (config != null)
            {
                configs[$"{prefix}[0]"] = config;
            }
        }
    }

    /// <summary>
    /// Crea la configuración específica para cada tipo de campo
    /// Debe ser implementado por cada preset
    /// </summary>
    protected abstract DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue);
}
