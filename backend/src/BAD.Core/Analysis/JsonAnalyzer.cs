using Newtonsoft.Json.Linq;

namespace BAD.Core.Analysis;

public class JsonAnalyzer
{
    private JObject jsonObject;

    public JsonAnalyzer(string json)
    {
        jsonObject = JObject.Parse(json);
    }

    public JObject GetJsonObject() => jsonObject;

    public List<JToken> GetValues()
    {
        return jsonObject.Values().ToList();
    }

    public List<string> GetKeys()
    {
        return jsonObject.Properties().Select(p => p.Name).ToList();
    }

    public static string GetUnderlyingType(JToken token)
    {
        if (token is JValue jValue)
        {
            if (jValue.Value is DateTime)
            {
                return "DateTime";
            }
            else if (jValue.Value != null && DateTime.TryParse(jValue.Value.ToString(), out _))
            {
                return "DateTime";
            }
            else if (jValue.Value is string)
            {
                return "string";
            }
            else if (jValue.Value is bool)
            {
                return "bool";
            }
            else if (jValue.Value is null)
            {
                return "null";
            }
            else
            {
                return jValue.Type.ToString();
            }
        }
        else
        {
            return "object";
        }
    }

    public static JTokenType GetType(JToken token)
    {
        if (token is JValue jValue)
        {
            if (jValue.Value is DateTime)
            {
                return JTokenType.Date;
            }
            else if (jValue.Value is string strValue)
            {
                if (IsGuid(strValue))
                {
                    return JTokenType.Guid;
                }
                if (DateTime.TryParse(strValue, out _))
                {
                    return JTokenType.Date;
                }
                return JTokenType.String;
            }
            else if (jValue.Value is int || jValue.Value is long)
            {
                return JTokenType.Integer;
            }
            else if (jValue.Value is float || jValue.Value is double || jValue.Value is decimal)
            {
                return JTokenType.Float;
            }
            else if (jValue.Value is bool)
            {
                return JTokenType.Boolean;
            }
            else if (jValue.Value is null)
            {
                return JTokenType.Null;
            }
            else
            {
                return jValue.Type;
            }
        }
        else if (token is JArray)
        {
            return JTokenType.Array;
        }
        else
        {
            return JTokenType.Object;
        }
    }

    /// <summary>
    /// Verifica si un string es un GUID válido
    /// </summary>
    public static bool IsGuid(string value)
    {
        if (string.IsNullOrEmpty(value)) return false;
        return Guid.TryParse(value, out _);
    }

    /// <summary>
    /// Obtiene todas las claves con sus tipos y valores de un JSON
    /// </summary>
    public static List<(string Key, JTokenType Type, JToken Value)> GetAllKeysWithTypes(JObject json, string prefix = "")
    {
        var result = new List<(string Key, JTokenType Type, JToken Value)>();

        foreach (var property in json.Properties())
        {
            string fullKey = string.IsNullOrEmpty(prefix) ? property.Name : $"{prefix}.{property.Name}";
            var tokenType = GetType(property.Value);

            if (property.Value is JObject nestedObj)
            {
                result.Add((fullKey, JTokenType.Object, property.Value));
                result.AddRange(GetAllKeysWithTypes(nestedObj, fullKey));
            }
            else if (property.Value is JArray array)
            {
                result.Add((fullKey, JTokenType.Array, property.Value));
                if (array.Count > 0 && array[0] is JObject firstObj)
                {
                    result.AddRange(GetAllKeysWithTypes(firstObj, $"{fullKey}[0]"));
                }
            }
            else
            {
                result.Add((fullKey, tokenType, property.Value));
            }
        }

        return result;
    }
}
