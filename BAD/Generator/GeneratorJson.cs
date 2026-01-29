using BAD.Generator.Configurations;
using BAD.JsonReader;
using Newtonsoft.Json.Linq;

namespace BAD.Generator;

/// <summary>
/// Configuración global para la generación de valores aleatorios
/// </summary>
public class GeneratorConfig
{
    // Rangos para integers
    public int IntegerMin { get; set; } = 1;
    public int IntegerMax { get; set; } = 100;

    // Rangos para floats
    public float FloatMin { get; set; } = 0.0f;
    public float FloatMax { get; set; } = 1000.0f;
    public int FloatDecimals { get; set; } = 2;

    // Configuración para strings
    public int StringLength { get; set; } = 10;
    public bool StringBeginUpperCase { get; set; } = true;

    // Rangos para fechas
    public string DateMin { get; set; } = "1990-01-01";
    public string DateMax { get; set; } = "2024-12-31";
    public string DateFormat { get; set; } = "O"; // ISO 8601
}

public class GeneratorJson
{
    public static Dictionary<string, DefaultValueConfig> DefaultValuesOperations = new Dictionary<string, DefaultValueConfig>();
    public static GeneratorConfig Config { get; set; } = new GeneratorConfig();

    /// <summary>
    /// Agrega una configuración de valor por defecto para una key específica
    /// </summary>
    public static void AddNewDefaultValue(string keyJson, DefaultValueConfig defaultValueConfig)
    {
        if (DefaultValuesOperations.ContainsKey(keyJson))
        {
            DefaultValuesOperations[keyJson] = defaultValueConfig;
        }
        else
        {
            DefaultValuesOperations.Add(keyJson, defaultValueConfig);
        }
    }

    /// <summary>
    /// Limpia todas las configuraciones de valores por defecto
    /// </summary>
    public static void ClearDefaultValues()
    {
        DefaultValuesOperations.Clear();
    }

    /// <summary>
    /// Genera un nuevo JSON con valores aleatorios basado en el JSON base
    /// </summary>
    public static dynamic GeneratorJsonValues(dynamic json)
    {
        try
        {
            var jsonObject = JObject.Parse(json);
            jsonObject = GenerateValue(jsonObject);
            return jsonObject.ToString();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Error al generar JSON: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Genera múltiples JSONs basados en el JSON base
    /// </summary>
    public static List<string> GenerateMultiple(string json, int count)
    {
        var results = new List<string>();
        for (int i = 0; i < count; i++)
        {
            results.Add(GeneratorJsonValues(json));
        }
        return results;
    }

    private static dynamic GenerateValue(dynamic jsonData)
    {
        foreach (var property in jsonData.Properties())
        {
            var key = property.Path;
            JToken value = property.Value;

            #region Logic for default value operations
            var operationResult = ProcessDefaultValueOperation(key, value);
            if (operationResult.HasValue)
            {
                if (operationResult.Value.shouldSkip)
                {
                    continue; // NotChange operation
                }
                property.Value = operationResult.Value.newValue;
                continue;
            }
            #endregion

            #region Logic to generate random values
            JTokenType typeValue = Analyzer.GetType(value);

            switch (typeValue)
            {
                case JTokenType.String:
                    property.Value = GenerateStringValue((string)property.Value);
                    break;

                case JTokenType.Integer:
                    property.Value = GeneratorInteger.RandomInteger(Config.IntegerMin, Config.IntegerMax);
                    break;

                case JTokenType.Boolean:
                    property.Value = GeneratorBoolean.RandomBoolean();
                    break;

                case JTokenType.Float:
                    property.Value = GenerateFloat.FloatRandom(Config.FloatMin, Config.FloatMax, Config.FloatDecimals);
                    break;

                case JTokenType.Date:
                    property.Value = GeneratorDateTime.RandomDatetime(Config.DateMin, Config.DateMax, Config.DateFormat);
                    break;

                case JTokenType.Object:
                    ProcessObjectOrArray(property);
                    break;

                case JTokenType.Null:
                    // Mantener null
                    break;
            }
            #endregion
        }
        return jsonData;
    }

    private static string GenerateStringValue(string currentValue)
    {
        if (GeneratorString.IsUUID(currentValue))
        {
            return GeneratorString.StringRandomUUID().ToString();
        }
        return GeneratorString.StringRandomAllCase(Config.StringLength, Config.StringBeginUpperCase, false);
    }

    private static void ProcessObjectOrArray(dynamic property)
    {
        if (property.Value is JArray array)
        {
            for (int i = 0; i < array.Count; i++)
            {
                var obj = array[i];
                if (obj is JObject)
                {
                    GenerateValue(obj);
                }
            }
        }
        else if (property.Value is JObject)
        {
            GenerateValue(property.Value);
        }
    }

    private static (bool shouldSkip, JToken? newValue)? ProcessDefaultValueOperation(string keyJson, JToken originalValue)
    {
        if (!DefaultValuesOperations.ContainsKey(keyJson))
        {
            return null;
        }

        DefaultValueConfig operationConfig = DefaultValuesOperations[keyJson];

        switch (operationConfig.Operation)
        {
            case EnumOperations.NotChange:
                return (true, null); // Skip, mantener valor original

            case EnumOperations.ForceNull:
                return (false, JValue.CreateNull());

            case EnumOperations.Replace:
            default:
                var newValue = GetReplacementValue(ref operationConfig);
                return (false, newValue != null ? JToken.FromObject(newValue) : JValue.CreateNull());
        }
    }

    private static dynamic? GetReplacementValue(ref DefaultValueConfig defaultValueConfig)
    {
        if (defaultValueConfig.TypeDefault == JTokenType.Array && defaultValueConfig.Value is Array arr && arr.Length > 0)
        {
            // Rotación de valores del array
            var valueReturn = arr.GetValue(0);
            var head = valueReturn;

            // Rotar el array
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
