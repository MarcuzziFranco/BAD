using Newtonsoft.Json.Linq;

namespace BAD.JsonReader;

public class Analyzer
{

    private JObject jsonObject;
    public Analyzer(dynamic json)
    {
        // Deserializar el JSON a un objeto JObject
        jsonObject = JObject.Parse(json);
    }

    public void PrintListValues()
    {
        // Obtener la lista de valores
        var values = jsonObject.Values().ToList();
        // Imprimir la lista de valores
        Console.WriteLine("List value json:");
        foreach (var value in values)
        {
            Console.WriteLine(value);
        }
        Console.WriteLine("\n");
    }


    public void PrintListKeys()
    {
        var keys = jsonObject.Properties().Select(p => p.Name).ToList();
        Console.WriteLine("List value json:");
        foreach (var key in keys)
        {
            Console.WriteLine(key);
        }
        Console.WriteLine("\n");
    }

    public void PrintListValuesType()
    {
        // Obtener la lista de valores
        var values = jsonObject.Values().ToList();
        // Conocer el tipo de cada valor
        Console.WriteLine("Types value json:");
        foreach (var value in values)
        {
            string valueType = GetUnderlyingType(value);
            Console.WriteLine($"{valueType}");
        }
        Console.WriteLine("\n");
    }
    public static string GetUnderlyingType(JToken token)
    {
        if (token is JValue jValue)
        {
            // Si es un JValue, verificar el tipo de contenido
            if (jValue.Value is DateTime)
            {
                return "DateTime";
            }
            else if (DateTime.TryParse(jValue.Value.ToString(), out _))
            {
                // Intentar parsear el string como DateTime
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
                // Otros tipos de datos primitivos
                return jValue.Type.ToString();
            }
        }
        else
        {
            // Si es un objeto o una matriz, devolver el tipo Object
            return "object";
        }
    }



    public static JTokenType GetType(JToken token)
    {
        if (token is JValue jValue)
        {
            // Si es un JValue, verificar el tipo de contenido
            if (jValue.Value is DateTime)
            {
                return JTokenType.Date;
            }
            else if (DateTime.TryParse(jValue.Value.ToString(), out _))
            {
                // Intentar parsear el string como DateTime
                return JTokenType.Date;
            }
            else if (jValue.Value is string)
            {
                return JTokenType.String;
            }
            else if (jValue.Value is int)
            {
                return JTokenType.Integer;
            }
            else if (jValue.Value is long)
            {
                return JTokenType.Integer;
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
                // Other types (AGREGAR ESTOS DATOS)
                return JTokenType.None;
            }
        }
        else
        {
            return JTokenType.Object;
        }
    }

}
