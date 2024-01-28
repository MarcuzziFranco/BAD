using BAD.Generator.Configurations;
using BAD.JsonReader;
using Newtonsoft.Json.Linq;

namespace BAD.Generator;

public class GeneratorJson
{
    public static Dictionary<string, DefaultValueConfig> DefaultValuesOperations = new Dictionary<string, DefaultValueConfig>();

    public static void AddNewDefaultValue(string keyJson, DefaultValueConfig defaultValueConfig)
    {
        DefaultValuesOperations.Add(keyJson, defaultValueConfig);
    }

    public static dynamic GeneratorJsonValues(dynamic json)
    {
        var jsonObject = JObject.Parse(json);

        jsonObject = GenerateValue(jsonObject);

        return jsonObject.ToString();
    }

    private static dynamic GenerateValue(dynamic jsonData)
    {
        foreach (var property in jsonData.Properties())
        {
            #region Logic for setting values to default
            var key = property.Path;
            JToken value = property.Value;

            var defaultValue = DefaultValue(key);
            if (defaultValue != null)
            {
                property.Value = defaultValue;
                continue;
            }
            #endregion

            #region Logic to generate random values
            JTokenType typeValue = Analyzer.GetType(value);
            if (typeValue == JTokenType.String)
            {
                if (GeneratorString.IsUUID((string)property.Value))
                {
                    property.Value = GeneratorString.StringRandomUUID();
                }
                else property.Value = GeneratorString.StringRandomAllCase(10, true, false);

            }
            else if (typeValue == JTokenType.Integer)
            {
                property.Value = GeneratorInteger.RandomInteger(18, 70);
            }
            else if (typeValue == JTokenType.Boolean)
            {
                property.Value = GeneratorBoolean.RandomBoolean();
            }
            else if (value.Type == JTokenType.Float)
            {
                property.Value = GenerateFloat.FloatRandom(100, 1000, 4);
            }
            else if (typeValue == JTokenType.Date)
            {
                property.Value = GeneratorDateTime.RandomDatetime("1993-09-02", "1995-09-02", "O");
            }
            else if (typeValue == JTokenType.Object)
            {
                if (property.Value is JArray)
                {
                    for (int i = 0; i < property.Value.Count; i++)
                    {
                        var obj = property.Value[i];
                        GenerateValue(obj);
                    }
                }
                else GenerateValue(property.Value);
            }
        }
        #endregion
        return jsonData;
    }

    private static dynamic? DefaultValue(string keyJson)
    {
        if (DefaultValuesOperations.ContainsKey(keyJson))
        {
            DefaultValueConfig operationConfig = DefaultValuesOperations[keyJson];
            return GettingDefaultValueOperations(ref operationConfig);
        }
        return null;
    }

    private static dynamic GettingDefaultValueOperations(ref DefaultValueConfig defaultValueConfig)
    {
        if (defaultValueConfig.TypeDefault == JTokenType.Array)
        {
            var valueReturn = defaultValueConfig.Value[0];
            var head = valueReturn;
            Array.Copy(defaultValueConfig.Value, 1, defaultValueConfig.Value, 0, defaultValueConfig.Value.Length - 1);
            defaultValueConfig.Value[defaultValueConfig.Value.Length - 1] = head;
            return valueReturn;
        }
        return defaultValueConfig.Value;
    }



}
