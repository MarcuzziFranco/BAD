using System.Text.RegularExpressions;
using BAD.Core.Analysis;
using BAD.Core.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Core.Generators;

public class GeneratorJson
{
    public Dictionary<string, DefaultValueConfig> DefaultValuesOperations { get; } = new();
    public GeneratorConfig Config { get; set; } = new();

    /// <summary>
    /// Agrega una configuración de valor por defecto para una key específica
    /// </summary>
    public void AddDefaultValue(string keyJson, DefaultValueConfig defaultValueConfig)
    {
        DefaultValuesOperations[keyJson] = defaultValueConfig;
    }

    /// <summary>
    /// Limpia todas las configuraciones de valores por defecto
    /// </summary>
    public void ClearDefaultValues()
    {
        DefaultValuesOperations.Clear();
    }

    /// <summary>
    /// Genera un nuevo JSON con valores aleatorios basado en el JSON base
    /// </summary>
    public string GenerateJsonValues(string json)
    {
        try
        {
            var jsonObject = JObject.Parse(json);
            var result = GenerateValue(jsonObject);
            return result.ToString();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error al generar JSON: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Genera múltiples JSONs basados en el JSON base
    /// </summary>
    public List<string> GenerateMultiple(string json, int count)
    {
        var results = new List<string>();
        for (int i = 0; i < count; i++)
        {
            results.Add(GenerateJsonValues(json));
        }
        return results;
    }

    private JObject GenerateValue(JObject jsonData)
    {
        foreach (var property in jsonData.Properties().ToList())
        {
            var key = property.Path;
            JToken value = property.Value;

            var operationResult = ProcessDefaultValueOperation(key, value);
            if (operationResult != null)
            {
                if (operationResult.Value.shouldSkip)
                {
                    continue;
                }
                if (operationResult.Value.newValue != null)
                {
                    property.Value = operationResult.Value.newValue;
                }
                continue;
            }

            JTokenType typeValue = JsonAnalyzer.GetType(value);

            switch (typeValue)
            {
                case JTokenType.String:
                    var strValue = property.Value?.ToString() ?? "";
                    property.Value = GenerateStringValue(strValue);
                    break;

                case JTokenType.Guid:
                    property.Value = GeneratorString.StringRandomUUID().ToString();
                    break;

                case JTokenType.Integer:
                    property.Value = GeneratorInteger.RandomInteger(Config.IntegerMin, Config.IntegerMax);
                    break;

                case JTokenType.Boolean:
                    property.Value = GeneratorBoolean.RandomBoolean();
                    break;

                case JTokenType.Float:
                    property.Value = GeneratorFloat.FloatRandom(Config.FloatMin, Config.FloatMax, Config.FloatDecimals);
                    break;

                case JTokenType.Date:
                    property.Value = GeneratorDateTime.RandomDatetime(Config.DateMin, Config.DateMax, Config.DateFormat);
                    break;

                case JTokenType.Object:
                case JTokenType.Array:
                    ProcessObjectOrArray(property);
                    break;

                case JTokenType.Null:
                    break;
            }
        }
        return jsonData;
    }

    private string GenerateStringValue(string currentValue)
    {
        if (GeneratorString.IsUUID(currentValue))
        {
            return GeneratorString.StringRandomUUID().ToString();
        }
        return GeneratorString.StringRandomAllCase(Config.StringLength, Config.StringBeginUpperCase, false);
    }

    private void ProcessObjectOrArray(JProperty property)
    {
        if (property.Value is JArray array)
        {
            ProcessArray(array, property.Path);
        }
        else if (property.Value is JObject jObject)
        {
            GenerateValue(jObject);
        }
    }

    private void ProcessArray(JArray array, string basePath)
    {
        for (int i = 0; i < array.Count; i++)
        {
            var element = array[i];
            string elementPath = $"{basePath}[{i}]";

            if (element is JObject jObj)
            {
                GenerateValue(jObj);
            }
            else if (element is JArray nestedArray)
            {
                ProcessArray(nestedArray, elementPath);
            }
            else
            {
                var operationResult = ProcessDefaultValueOperation(elementPath, element);
                if (operationResult != null)
                {
                    if (!operationResult.Value.shouldSkip && operationResult.Value.newValue != null)
                    {
                        array[i] = operationResult.Value.newValue;
                    }
                }
                else
                {
                    var newValue = GenerateRandomValueForType(JsonAnalyzer.GetType(element), element);
                    if (newValue != null)
                    {
                        array[i] = newValue;
                    }
                }
            }
        }
    }

    private JToken? GenerateRandomValueForType(JTokenType type, JToken currentValue)
    {
        return type switch
        {
            JTokenType.String => GenerateStringValue(currentValue?.ToString() ?? ""),
            JTokenType.Guid => GeneratorString.StringRandomUUID().ToString(),
            JTokenType.Integer => GeneratorInteger.RandomInteger(Config.IntegerMin, Config.IntegerMax),
            JTokenType.Float => GeneratorFloat.FloatRandom(Config.FloatMin, Config.FloatMax, Config.FloatDecimals),
            JTokenType.Boolean => GeneratorBoolean.RandomBoolean(),
            JTokenType.Date => GeneratorDateTime.RandomDatetime(Config.DateMin, Config.DateMax, Config.DateFormat),
            _ => null
        };
    }

    private (bool shouldSkip, JToken? newValue)? ProcessDefaultValueOperation(string keyJson, JToken originalValue)
    {
        if (!DefaultValuesOperations.TryGetValue(keyJson, out var operationConfig))
        {
            string normalizedKey = NormalizeArrayIndexes(keyJson);
            if (normalizedKey != keyJson && !DefaultValuesOperations.TryGetValue(normalizedKey, out operationConfig))
            {
                return null;
            }
            else if (normalizedKey == keyJson)
            {
                return null;
            }
        }

        switch (operationConfig!.Operation)
        {
            case EnumOperations.NotChange:
                return (true, null);

            case EnumOperations.ForceNull:
                return (false, JValue.CreateNull());

            case EnumOperations.RandomRange:
                var rangeValue = GenerateRandomInRange(operationConfig);
                return (false, rangeValue != null ? JToken.FromObject(rangeValue) : originalValue);

            case EnumOperations.Replace:
            default:
                var newValue = GetReplacementValue(ref operationConfig);
                return (false, newValue != null ? JToken.FromObject(newValue) : JValue.CreateNull());
        }
    }

    private static string NormalizeArrayIndexes(string path)
    {
        return Regex.Replace(path, @"\[\d+\]", "[0]");
    }

    private object? GenerateRandomInRange(DefaultValueConfig config)
    {
        if (config.MinValue == null || config.MaxValue == null)
        {
            return null;
        }

        if (config.TypeDefault == JTokenType.Integer ||
            (config.MinValue is int || config.MinValue is long))
        {
            int min = Convert.ToInt32(config.MinValue);
            int max = Convert.ToInt32(config.MaxValue);
            return GeneratorInteger.RandomInteger(min, max);
        }
        else if (config.TypeDefault == JTokenType.Float ||
                 (config.MinValue is float || config.MinValue is double || config.MinValue is decimal))
        {
            float min = Convert.ToSingle(config.MinValue);
            float max = Convert.ToSingle(config.MaxValue);
            return GeneratorFloat.FloatRandom(min, max, Config.FloatDecimals);
        }
        else if (config.TypeDefault == JTokenType.Date ||
                 config.MinValue is DateTime || config.MinValue is string)
        {
            string minDate = config.MinValue?.ToString() ?? Config.DateMin;
            string maxDate = config.MaxValue?.ToString() ?? Config.DateMax;
            return GeneratorDateTime.RandomDatetime(minDate, maxDate, Config.DateFormat);
        }

        return null;
    }

    private static dynamic? GetReplacementValue(ref DefaultValueConfig defaultValueConfig)
    {
        if (defaultValueConfig.TypeDefault == JTokenType.Array && defaultValueConfig.Value is Array arr && arr.Length > 0)
        {
            var valueReturn = arr.GetValue(0);
            var head = valueReturn;

            for (int i = 0; i < arr.Length - 1; i++)
            {
                arr.SetValue(arr.GetValue(i + 1), i);
            }
            arr.SetValue(head, arr.Length - 1);

            return valueReturn ?? defaultValueConfig.Value;
        }

        return defaultValueConfig.Value;
    }
}
