using System.Collections;
using System.Linq;
using BAD.API.DTOs;
using BAD.Core.Analysis;
using BAD.Core.Configurations;
using BAD.Core.Presets;
using Newtonsoft.Json.Linq;

namespace BAD.API.Helpers;

/// <summary>
/// Convierte la salida de un <see cref="IPreset"/> a lista de <see cref="FieldConfigDto"/> (como mutaciones manuales).
/// </summary>
public static class PresetFieldConfigFactory
{
    public static List<FieldConfigDto> Expand(IPreset preset, JObject jsonObject)
    {
        var fromPreset = preset.GenerateConfig(jsonObject);
        var rows = JsonAnalyzer.GetAllKeysWithTypes(jsonObject)
            .Where(t => t.Type != JTokenType.Object && t.Type != JTokenType.Array)
            .ToList();

        var list = new List<FieldConfigDto>(rows.Count);
        foreach (var row in rows)
        {
            if (fromPreset.TryGetValue(row.Key, out var cfg))
                list.Add(MapToDto(row.Key, cfg));
            else
                list.Add(new FieldConfigDto { Key = row.Key, Operation = "Random" });
        }

        return list;
    }

    private static FieldConfigDto MapToDto(string key, DefaultValueConfig c)
    {
        return c.Operation switch
        {
            EnumOperations.NotChange => new FieldConfigDto { Key = key, Operation = "NotChange" },
            EnumOperations.ForceNull => new FieldConfigDto { Key = key, Operation = "ForceNull" },
            EnumOperations.RandomRange => new FieldConfigDto
            {
                Key = key,
                Operation = "RandomRange",
                MinValue = c.MinValue,
                MaxValue = c.MaxValue
            },
            EnumOperations.Replace when c.TypeDefault == JTokenType.Array && c.Value != null => new FieldConfigDto
            {
                Key = key,
                Operation = "RotateList",
                ListValues = ToObjectList(c.Value)
            },
            EnumOperations.Replace => new FieldConfigDto
            {
                Key = key,
                Operation = "Replace",
                Value = c.Value
            },
            _ => new FieldConfigDto { Key = key, Operation = "Random" }
        };
    }

    private static List<object>? ToObjectList(dynamic? value)
    {
        if (value is JArray ja)
            return ja.ToObject<List<object>>();
        if (value is object[] arr)
            return arr.ToList();
        if (value is IEnumerable en && value is not string)
            return en.Cast<object>().ToList();
        return null;
    }
}
