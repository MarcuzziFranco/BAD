using BAD.JsonReader;
using Newtonsoft.Json.Linq;
using System.Reflection.Metadata.Ecma335;
using System.Text.Json.Nodes;

namespace BAD.Generator;

public class GeneratorJson
{
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
            JToken value = property.Value;

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
                property.Value = GenerateFloat.FloatRandom(100, 1000,4);
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
        return jsonData;
    }
}
