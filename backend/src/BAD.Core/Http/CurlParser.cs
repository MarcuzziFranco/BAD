using System.Text.RegularExpressions;

namespace BAD.Core.Http;

/// <summary>
/// Parser para comandos cURL - soporta múltiples formatos y variaciones
/// </summary>
public class CurlParser
{
    public class ParsedCurl
    {
        public string Url { get; set; } = string.Empty;
        public string Method { get; set; } = "GET";
        public Dictionary<string, string> Headers { get; set; } = new();
        public string? Body { get; set; }
        public string? AuthType { get; set; }
        public string? AuthValue { get; set; }
        public List<string> Warnings { get; set; } = new();
    }

    public static ParsedCurl Parse(string curlCommand)
    {
        var result = new ParsedCurl();
        
        if (string.IsNullOrWhiteSpace(curlCommand))
        {
            throw new ArgumentException("El comando cURL está vacío");
        }

        // Normalizar el comando: remover saltos de línea con \
        var normalized = NormalizeCommand(curlCommand);
        
        // Verificar que empiece con curl
        if (!normalized.TrimStart().StartsWith("curl", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("El comando debe comenzar con 'curl'");
        }

        // Extraer URL
        result.Url = ExtractUrl(normalized);
        if (string.IsNullOrEmpty(result.Url))
        {
            throw new ArgumentException("No se pudo encontrar una URL válida en el comando");
        }

        // Extraer método HTTP
        result.Method = ExtractMethod(normalized);

        // Extraer headers
        result.Headers = ExtractHeaders(normalized);

        // Extraer body/data
        result.Body = ExtractBody(normalized);

        // Si hay body pero no hay método explícito, asumir POST
        if (!string.IsNullOrEmpty(result.Body) && !HasExplicitMethod(normalized))
        {
            result.Method = "POST";
        }

        // Extraer autenticación
        ExtractAuth(normalized, result);

        // Detectar Content-Type si no está presente y hay body
        if (!string.IsNullOrEmpty(result.Body) && !result.Headers.ContainsKey("Content-Type"))
        {
            // Intentar detectar si es JSON
            if (result.Body.TrimStart().StartsWith("{") || result.Body.TrimStart().StartsWith("["))
            {
                result.Headers["Content-Type"] = "application/json";
                result.Warnings.Add("Se asumió Content-Type: application/json basado en el body");
            }
        }

        return result;
    }

    private static string NormalizeCommand(string command)
    {
        // Remover continuaciones de línea (\ al final)
        var normalized = Regex.Replace(command, @"\\\s*[\r\n]+\s*", " ");
        // Normalizar espacios múltiples
        normalized = Regex.Replace(normalized, @"\s+", " ");
        return normalized.Trim();
    }

    private static string ExtractUrl(string command)
    {
        // Patrones para encontrar URL
        var patterns = new[]
        {
            // URL entre comillas simples o dobles
            @"curl\s+.*?['""]?(https?://[^'""\s]+)['""]?",
            // URL después de --url
            @"--url\s+['""]?(https?://[^'""\s]+)['""]?",
            // URL sin comillas al final o en medio
            @"\s(https?://[^\s'""]+)",
        };

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(command, pattern, RegexOptions.IgnoreCase);
            if (match.Success && match.Groups.Count > 1)
            {
                return match.Groups[1].Value.Trim('\'', '"');
            }
        }

        // Buscar URL sin protocolo (asumiendo https)
        var noProtocolMatch = Regex.Match(command, @"curl\s+['""]?([a-zA-Z0-9][-a-zA-Z0-9]*\.[^\s'""]+)['""]?");
        if (noProtocolMatch.Success)
        {
            return "https://" + noProtocolMatch.Groups[1].Value.Trim('\'', '"');
        }

        return string.Empty;
    }

    private static string ExtractMethod(string command)
    {
        // -X o --request
        var patterns = new[]
        {
            @"-X\s+['""]?(\w+)['""]?",
            @"--request\s+['""]?(\w+)['""]?",
        };

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(command, pattern, RegexOptions.IgnoreCase);
            if (match.Success)
            {
                return match.Groups[1].Value.ToUpperInvariant();
            }
        }

        return "GET";
    }

    private static bool HasExplicitMethod(string command)
    {
        return Regex.IsMatch(command, @"(-X|--request)\s+", RegexOptions.IgnoreCase);
    }

    private static Dictionary<string, string> ExtractHeaders(string command)
    {
        var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        // Patrones para headers: -H y --header
        var patterns = new[]
        {
            @"-H\s+['""]([^'""]+)['""]",
            @"--header\s+['""]([^'""]+)['""]",
            @"-H\s+'([^']+)'",
            @"-H\s+""([^""]+)""",
        };

        foreach (var pattern in patterns)
        {
            var matches = Regex.Matches(command, pattern, RegexOptions.IgnoreCase);
            foreach (Match match in matches)
            {
                var headerValue = match.Groups[1].Value;
                var colonIndex = headerValue.IndexOf(':');
                if (colonIndex > 0)
                {
                    var key = headerValue.Substring(0, colonIndex).Trim();
                    var value = headerValue.Substring(colonIndex + 1).Trim();
                    headers[key] = value;
                }
            }
        }

        return headers;
    }

    private static string? ExtractBody(string command)
    {
        // Patrones para body/data
        var patterns = new[]
        {
            @"-d\s+'([^']*)'",
            @"-d\s+""([^""]*)""",
            @"--data\s+'([^']*)'",
            @"--data\s+""([^""]*)""",
            @"--data-raw\s+'([^']*)'",
            @"--data-raw\s+""([^""]*)""",
            @"--data-binary\s+'([^']*)'",
            @"--data-binary\s+""([^""]*)""",
            // Sin comillas (hasta el siguiente flag o fin)
            @"-d\s+([^\s-][^\s]*)",
            @"--data\s+([^\s-][^\s]*)",
        };

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(command, pattern, RegexOptions.IgnoreCase);
            if (match.Success)
            {
                var body = match.Groups[1].Value;
                // Decodificar escapes comunes
                body = body.Replace("\\n", "\n")
                          .Replace("\\t", "\t")
                          .Replace("\\\"", "\"")
                          .Replace("\\'", "'");
                return body;
            }
        }

        return null;
    }

    private static void ExtractAuth(string command, ParsedCurl result)
    {
        // Basic auth: -u o --user
        var basicAuthPatterns = new[]
        {
            @"-u\s+['""]?([^'"":\s]+):([^'"":\s]+)['""]?",
            @"--user\s+['""]?([^'"":\s]+):([^'"":\s]+)['""]?",
            @"-u\s+['""]?([^'""\s]+)['""]?",
            @"--user\s+['""]?([^'""\s]+)['""]?",
        };

        foreach (var pattern in basicAuthPatterns)
        {
            var match = Regex.Match(command, pattern, RegexOptions.IgnoreCase);
            if (match.Success)
            {
                result.AuthType = "Basic";
                if (match.Groups.Count > 2)
                {
                    result.AuthValue = $"{match.Groups[1].Value}:{match.Groups[2].Value}";
                }
                else
                {
                    result.AuthValue = match.Groups[1].Value;
                }
                return;
            }
        }

        // Bearer token desde header Authorization
        if (result.Headers.TryGetValue("Authorization", out var authHeader))
        {
            if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                result.AuthType = "Bearer";
                result.AuthValue = authHeader.Substring(7).Trim();
                result.Headers.Remove("Authorization");
            }
            else if (authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            {
                result.AuthType = "Basic";
                result.AuthValue = authHeader.Substring(6).Trim();
                result.Headers.Remove("Authorization");
            }
        }
    }
}
