using System.Text.Json;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Readers;

namespace BAD.Core.OpenApi;

public static class OpenApiDocumentLoader
{
    public static OpenApiDocument Parse(string specContent)
    {
        if (string.IsNullOrWhiteSpace(specContent))
            throw new OpenApiImportException("La especificación OpenAPI está vacía.");

        var version = ExtractVersionFromRaw(specContent);
        if (!version.StartsWith("3.", StringComparison.Ordinal))
            throw new OpenApiImportException($"Solo se soporta OpenAPI 3.x (recibido: {version}).");

        var reader = new OpenApiStreamReader();
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(specContent));
        var result = reader.Read(stream, out var diagnostic);

        if (result == null)
            throw new OpenApiImportException("No se pudo parsear el documento OpenAPI.");

        if (diagnostic?.Errors?.Count > 0)
        {
            var msg = string.Join("; ", diagnostic.Errors.Take(3).Select(e => e.Message));
            throw new OpenApiImportException($"Errores al leer OpenAPI: {msg}");
        }

        return result;
    }

    public static string GetOpenApiVersion(OpenApiDocument doc) => "3.0.0";

    private static string ExtractVersionFromRaw(string specContent)
    {
        try
        {
            using var doc = JsonDocument.Parse(specContent);
            if (doc.RootElement.TryGetProperty("openapi", out var v))
                return v.GetString() ?? "3.0.0";
        }
        catch
        {
            // YAML u otro formato: el reader validará después
        }
        return "3.0.0";
    }

    public static string? GetSuggestedBaseUrl(OpenApiDocument doc)
    {
        var server = doc.Servers?.FirstOrDefault();
        if (server == null || string.IsNullOrWhiteSpace(server.Url))
            return null;
        return server.Url.TrimEnd('/');
    }
}

public class OpenApiImportException : Exception
{
    public OpenApiImportException(string message) : base(message) { }
}
