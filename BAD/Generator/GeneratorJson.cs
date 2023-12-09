using BAD.JsonReader;
using Newtonsoft.Json.Linq;

namespace BAD.Generator;

public class GeneratorJson
{
    public static dynamic GeneratorJsonValues(dynamic json)
    {
        var jsonObject = JObject.Parse(json);

        foreach (var property in jsonObject.Properties())
        {
            JToken value = property.Value;

            JTokenType typeValue = Analyzer.GetType(value);
            if (typeValue == JTokenType.String)
            {
                property.Value = GeneratorString.StringRandomAllCase(10, true, false);
            }
            else if (typeValue == JTokenType.Integer)
            {
                property.Value = GeneratorInteger.RandomInteger(18, 70);
            }
            else if (typeValue == JTokenType.Boolean)
            {
                property.Value = GeneratorBoolean.RandomBoolean();
            }
            /* else if (value.Type == JTokenType.Float)
             {
                 property.Value = random.NextDouble() * 100;
             }*/
            else if (typeValue == JTokenType.Date)
            {
                property.Value = GeneratorDateTime.RandomDatetime("1993-09-02", "1995-09-02", "O");
            }
        }

        return jsonObject.ToString();
    }
}
